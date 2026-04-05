import { db } from "@/lib/db";
import {
  buildInternshipInsertValues,
  canonicalTypes,
  getIngestUserId,
  internshipIngestBatchSchema,
  internshipIngestRecordSchema,
} from "@/lib/internships-ingest";
import { isMissingHomepageFeatureColumnError } from "@/lib/db-errors";
import { internships, user } from "@/lib/schema";
import {
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { getSessionCached } from "@/lib/auth-session-cache";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const isBatch = Array.isArray(body);
    const records = isBatch
      ? internshipIngestBatchSchema.parse(body)
      : [internshipIngestRecordSchema.parse(body)];

    const ingestUserId = await getIngestUserId();
    const values = buildInternshipInsertValues(records, ingestUserId);

    const inserted = await db.insert(internships).values(values).returning();

    return NextResponse.json(
      {
        success: true,
        count: inserted.length,
        data: isBatch ? inserted : inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating internship:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    let isAdmin = false;
    try {
      const requestHeaders = await headers();
      const hasCookie = Boolean(requestHeaders.get("cookie"));
      if (hasCookie) {
        const session = await getSessionCached(requestHeaders);
        isAdmin = session?.user?.role === "admin";
      }
    } catch {
      isAdmin = false;
    }

    const { searchParams } = new URL(req.url);
    const searchParam = searchParams.get("search");
    const typesParam = searchParams.get("types") ?? searchParams.get("type");
    const tagsParam = searchParams.get("tags");
    const locationParam = searchParams.get("location");
    const minStipendParam = Number.parseInt(
      searchParams.get("minStipend") ?? "",
      10
    );
    const maxStipendParam = Number.parseInt(
      searchParams.get("maxStipend") ?? "",
      10
    );
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);
    const featuredParam = searchParams.get("featured");
    const preferredParam = searchParams.get("preferred");
    const idsParam = searchParams.get("ids");

    const searchTerm = searchParam ? searchParam.trim() : "";
    const rawTypes = typesParam
      ? typesParam
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const validTypes = rawTypes.filter((type) =>
      canonicalTypes.includes(type as (typeof canonicalTypes)[number])
    );

    const rawTags = tagsParam
      ? tagsParam
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const rawLocations = locationParam
      ? locationParam
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
    const minStipend = Number.isNaN(minStipendParam)
      ? undefined
      : minStipendParam;
    const maxStipend = Number.isNaN(maxStipendParam)
      ? undefined
      : maxStipendParam;
    const limit = Number.isNaN(limitParam)
      ? undefined
      : Math.min(Math.max(limitParam, 1), 100);
    const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);
    const featuredOnly = featuredParam === "true";
    const preferFeatured = preferredParam === "featured";
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    const conditions: SQL<unknown>[] = [isNull(internships.deletedAt)];

    if (!isAdmin) {
      conditions.push(eq(internships.isActive, true));
    }

    if (searchTerm) {
      conditions.push(
        or(
          ilike(internships.title, `%${searchTerm}%`),
          ilike(internships.description, `%${searchTerm}%`),
          ilike(internships.hiringOrganization, `%${searchTerm}%`)
        )
      );
    }

    if (validTypes.length > 0) {
      conditions.push(inArray(internships.type, validTypes));
    }

    if (rawTags.length > 0) {
      const tagConditions = rawTags.map(
        (tag) =>
          sql`EXISTS (
            SELECT 1
            FROM unnest(coalesce(${internships.tags}, '{}'::text[])) AS t(tag_name)
            WHERE lower(t.tag_name) = ${tag}
          )`
      );

      conditions.push(
        tagConditions.length === 1 ? tagConditions[0] : or(...tagConditions)
      );
    }

    if (rawLocations.length > 0) {
      const locationConditions = rawLocations.map((value) =>
        ilike(internships.location, `%${value}%`)
      );

      if (locationConditions.length === 1) {
        conditions.push(locationConditions[0]);
      } else {
        conditions.push(or(...locationConditions));
      }
    }

    if (minStipend !== undefined) {
      conditions.push(gte(internships.stipend, minStipend));
    }

    if (maxStipend !== undefined) {
      conditions.push(lte(internships.stipend, maxStipend));
    }

    if (ids.length > 0) {
      conditions.push(inArray(internships.id, ids));
    }

    // 🔥 Recent OR future deadline filter
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    if (ids.length === 0 && !featuredOnly) {
      conditions.push(
        or(
          gte(internships.createdAt, fiveDaysAgo),
          and(
            isNull(internships.deletedAt),
            gt(internships.deadline, sql`CURRENT_DATE`)
          )
        )
      );
    }

    const runQuery = async (
      withFeaturedColumns: boolean,
      onlyFeatured: boolean = featuredOnly
    ) => {
      const localConditions = [...conditions];
      if (onlyFeatured) {
        localConditions.push(eq(internships.isHomepageFeatured, true));
      }

      const filters =
        localConditions.length === 1
          ? localConditions[0]
          : and(...localConditions);

      const query = db
        .select({
          id: internships.id,
          title: internships.title,
          description: internships.description,
          type: internships.type,
          timing: internships.timing,
          link: internships.link,
          tags: internships.tags,
          stipend: internships.stipend,
          duration: internships.duration,
          experience: internships.experience,
          location: internships.location,
          deadline: internships.deadline,
          hiringOrganization: internships.hiringOrganization,
          hiringManager: internships.hiringManager,
          createdAt: internships.createdAt,
          updatedAt: internships.updatedAt,
          isVerified: internships.isVerified,
          isFlagged: internships.isFlagged,
          isActive: internships.isActive,
          ...(withFeaturedColumns
            ? {
                isHomepageFeatured: internships.isHomepageFeatured,
                homepageFeatureOrder: internships.homepageFeatureOrder,
              }
            : {}),
          userId: internships.userId,
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
            role: user.role,
          },
        })
        .from(internships)
        .leftJoin(user, eq(internships.userId, user.id))
        .where(filters)
        .orderBy(
          onlyFeatured && withFeaturedColumns
            ? asc(sql`coalesce(${internships.homepageFeatureOrder}, 2147483647)`)
            : desc(internships.createdAt),
          desc(internships.createdAt)
        );

      const rows =
        limit !== undefined
          ? await query.limit(limit + 1).offset(offset)
          : await query;

      let allInternships = rows;
      let pagination:
        | {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          }
        | undefined;

      if (limit !== undefined) {
        const hasMore = rows.length > limit;
        allInternships = hasMore ? rows.slice(0, limit) : rows;

        const total =
          (
            await db
              .select({ total: count() })
              .from(internships)
              .where(filters)
          )[0]?.total ?? 0;

        pagination = {
          limit,
          offset,
          total,
          hasMore,
        };
      }

      return {
        internships: withFeaturedColumns
          ? allInternships
          : allInternships.map((item) => ({
              ...item,
              isHomepageFeatured: undefined,
              homepageFeatureOrder: undefined,
            })),
        pagination,
      };
    };

    let payload: {
      internships: unknown[];
      pagination:
        | {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          }
        | undefined;
    };

    const runWithFeaturePreference = async (withFeaturedColumns: boolean) => {
      if (!preferFeatured) {
        return runQuery(withFeaturedColumns, featuredOnly);
      }

      const featuredPayload = await runQuery(withFeaturedColumns, true);
      if (featuredPayload.internships.length > 0) {
        return featuredPayload;
      }

      return runQuery(withFeaturedColumns, false);
    };

    try {
      payload = await runWithFeaturePreference(true);
    } catch (error) {
      if (!isMissingHomepageFeatureColumnError(error)) {
        throw error;
      }
      payload = await runWithFeaturePreference(false);
    }

    return NextResponse.json(
      {
        success: true,
        internships: payload.internships,
        ...(payload.pagination ? { pagination: payload.pagination } : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching internships:", error);
    return NextResponse.json(
      { error: "Failed to fetch internships" },
      { status: 500 }
    );
  }
}
