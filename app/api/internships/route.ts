import { db } from "@/lib/db";
import {
  buildInternshipInsertValues,
  canonicalTypes,
  getIngestUserId,
  internshipIngestBatchSchema,
  internshipIngestRecordSchema,
} from "@/lib/internships-ingest";
import { internships, user } from "@/lib/schema";
import {
  SQL,
  and,
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

    const location = locationParam ? locationParam.trim() : "";
    const minStipend = Number.isNaN(minStipendParam)
      ? undefined
      : minStipendParam;
    const maxStipend = Number.isNaN(maxStipendParam)
      ? undefined
      : maxStipendParam;

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

      conditions.push(tagConditions.length === 1 ? tagConditions[0] : or(...tagConditions));
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

    // 🔥 Recent OR future deadline filter
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    conditions.push(
      or(
        gte(internships.createdAt, fiveDaysAgo),
        and(
          isNull(internships.deletedAt),
          gt(internships.deadline, sql`CURRENT_DATE`)
        )
      )
    );

    const filters =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    // ✅ NO LIMIT (ALL DATA)
    const allInternships = await db
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
      .orderBy(desc(internships.createdAt));

    return NextResponse.json(
      {
        success: true,
        internships: allInternships,
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