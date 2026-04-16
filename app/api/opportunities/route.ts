import { db } from "@/lib/db";
import {
  SQL,
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  lte,
} from "drizzle-orm";
import { opportunities, tags, user } from "@/lib/schema";
import { createApiTimer } from "@/lib/api-timing";
import { getSessionCached } from "@/lib/auth-session-cache";
import { normalizeDateOnly } from "@/lib/date-utils";
import {
  getExistingTagIdsOrThrow,
  InvalidTagSelectionError,
} from "@/lib/tags";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const opportunitySchema = z.object({
  type: z.enum([
    "competitions_open_calls",
    "case_competitions",
    "hackathons",
    "fellowships",
    "ideathon_think_tanks",
    "leadership_programs",
    "awards_recognition",
    "grants_scholarships",
    "research_paper_ra_calls",
    "upskilling_events",
  ]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  images: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  organiserInfo: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  applyLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
  publishAt: z
    .union([
      z
        .string()
        .min(1)
        .refine((s) => !Number.isNaN(new Date(s).getTime()), {
          message: "Invalid datetime",
        }),
      z.literal(""),
      z.null(),
    ])
    .optional(),
});

async function getUserRoleFromSession(session: {
  user: { id: string; role?: string };
}) {
  if (!session?.user?.id) {
    return null;
  }

  const roleFromSession = session.user.role;
  if (roleFromSession) {
    return roleFromSession;
  }

  const row = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { role: true },
  });

  return row?.role ?? null;
}

function parsePublishAt(
  publishAt: string | "" | null | undefined
): Date | null | undefined {
  if (publishAt === undefined) {
    return undefined;
  }

  if (publishAt === "" || publishAt === null) {
    return null;
  }

  const parsedPublishAt = new Date(publishAt);
  if (Number.isNaN(parsedPublishAt.getTime())) {
    return undefined;
  }

  return parsedPublishAt;
}

function isMissingPublishAtColumnError(error: unknown) {
  const err = error as {
    message?: string;
    code?: string;
    cause?: { code?: string; column?: string; message?: string };
  };

  const code = err?.code || err?.cause?.code;
  if (code !== "42703") {
    return false;
  }

  return (
    err?.cause?.column === "publish_at" ||
    err?.cause?.message?.includes("publish_at") ||
    err?.message?.includes("publish_at") ||
    err?.message?.includes('"publish_at"')
  );
}

export async function POST(req: NextRequest) {
  const timer = createApiTimer("POST /api/opportunities");

  try {
    if (!db) {
      timer.end({ status: 500, reason: "missing_db" });
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    timer.mark("auth_start");
    const session = await getSessionCached(await headers());
    timer.mark("auth_done", { hasSession: Boolean(session?.user?.id) });
    if (!session?.user?.id) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    timer.mark("role_start");
    const userRole = await getUserRoleFromSession(
      session as { user: { id: string; role?: string } }
    );
    timer.mark("role_done", { hasRole: Boolean(userRole) });
    if (!userRole) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = opportunitySchema.parse(body);

    const canPostDirectly = userRole === "admin" || userRole === "member";

    const insertData: any = {
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      userId: session.user.id,
      isFlagged: false,
      isVerified: false,
      isActive: canPostDirectly,
    };

    if (validatedData.tags && Array.isArray(validatedData.tags)) {
      timer.mark("tags_lookup_start", {
        incomingTags: validatedData.tags.length,
      });
      const tagIds = await getExistingTagIdsOrThrow(validatedData.tags);
      timer.mark("tags_lookup_done", { resolvedTagIds: tagIds.length });
      if (tagIds.length > 0) {
        insertData.tagIds = tagIds;
      }
    }

    if (
      validatedData.images &&
      Array.isArray(validatedData.images) &&
      validatedData.images.length > 0
    ) {
      insertData.images = validatedData.images;
    }

    if (
      validatedData.attachments &&
      Array.isArray(validatedData.attachments) &&
      validatedData.attachments.length > 0
    ) {
      insertData.attachments = validatedData.attachments;
    }

    if (validatedData.location) {
      insertData.location = validatedData.location;
    }

    if (validatedData.organiserInfo) {
      insertData.organiserInfo = validatedData.organiserInfo;
    }

    if (validatedData.applyLink !== undefined) {
      insertData.applyLink =
        validatedData.applyLink === "" ? null : validatedData.applyLink;
    }

    if (validatedData.startDate) {
      const normalizedStartDate = normalizeDateOnly(validatedData.startDate);
      if (normalizedStartDate) {
        insertData.startDate = normalizedStartDate;
      }
    }

    if (validatedData.endDate) {
      const normalizedEndDate = normalizeDateOnly(validatedData.endDate);
      if (normalizedEndDate) {
        insertData.endDate = normalizedEndDate;
      }
    }

    const parsedPublishAt = parsePublishAt(validatedData.publishAt);
    if (parsedPublishAt !== undefined) {
      insertData.publishAt = parsedPublishAt;
    }

    timer.mark("insert_start");
    const newOpportunity = await db
      .insert(opportunities)
      .values(insertData)
      .returning();
    timer.mark("insert_done", { rowCount: newOpportunity.length });

    timer.end({ status: 201, userRole });
    return NextResponse.json(
      {
        success: true,
        data: newOpportunity[0],
        userRole,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InvalidTagSelectionError) {
      timer.end({ status: 400, reason: "invalid_tag_selection" });
      return NextResponse.json(
        {
          error: "Please select tags from existing suggestions only.",
          invalidTags: error.invalidTags,
        },
        { status: 400 }
      );
    }

    if (error instanceof z.ZodError) {
      timer.end({ status: 400, reason: "validation_error" });
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Full error object:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error creating opportunity:", errorMessage);

    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const timer = createApiTimer("GET /api/opportunities");

  try {
    if (!db) {
      timer.end({ status: 500, reason: "missing_db" });
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    timer.mark("auth_start");
    const session = await getSessionCached(await headers());
    timer.mark("auth_done", { hasSession: Boolean(session?.user?.id) });
    if (!session?.user?.id) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    timer.mark("role_start");
    const sessionRole = await getUserRoleFromSession(
      session as { user: { id: string; role?: string } }
    );
    timer.mark("role_done", { hasRole: Boolean(sessionRole) });
    if (!sessionRole) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);
    const searchParam = searchParams.get("search");
    const typesParam = searchParams.get("types");
    const tagsParam = searchParams.get("tags");
    const includeTotalParam = searchParams.get("includeTotal");
    const limit = Number.isNaN(limitParam) ? 10 : limitParam;
    const offset = Number.isNaN(offsetParam) ? 0 : offsetParam;
    const includeTotal = includeTotalParam === "true";
    const searchTerm = searchParam ? searchParam.trim() : "";
    const rawTypes = typesParam
      ? typesParam
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
    const allowedTypes = (opportunities.type.enumValues ?? []) as string[];
    const validTypes = rawTypes.filter((type) => allowedTypes.includes(type));
    const rawTags = tagsParam
      ? tagsParam
          .split("|")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const validLimit = Math.min(Math.max(limit, 1), 50);
    const validOffset = Math.max(offset, 0);
    const idsParam = searchParams.get("ids");
    const featuredParam = searchParams.get("featured");
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    timer.mark("query_prep_done", {
      includeTotal,
      validLimit,
      validOffset,
      hasSearch: Boolean(searchTerm),
      typeFilters: validTypes.length,
      tagFilters: rawTags.length,
    });

    const buildFilters = (usePublishAt: boolean) => {
      const conditions: SQL<unknown>[] = [isNull(opportunities.deletedAt)];

      if (ids.length > 0) {
        conditions.push(inArray(opportunities.id, ids));
      }

        if (usePublishAt && ids.length === 0) {
        conditions.push(
          or(
            isNull(opportunities.publishAt),
            lte(opportunities.publishAt, new Date())
          )
        );
      }

        if (sessionRole !== "admin" && ids.length === 0) {
        conditions.push(eq(opportunities.isActive, true));
      }

        if (featuredParam === "true") {
        conditions.push(eq(opportunities.featuredHome, true));
      }

      if (searchTerm) {
        conditions.push(
          or(
            ilike(opportunities.title, `%${searchTerm}%`),
            ilike(opportunities.description, `%${searchTerm}%`)
          )
        );
      }

      if (validTypes.length > 0) {
        conditions.push(inArray(opportunities.type, validTypes as any));
      }

      if (rawTags.length > 0) {
        const tagConditions = rawTags.map(
          (tag) =>
            sql`EXISTS (
            SELECT 1
            FROM ${tags} t
            WHERE lower(t.name) = ${tag}
              AND t.id = ANY(${opportunities.tagIds})
          )`
        );

        if (tagConditions.length === 1) {
          conditions.push(tagConditions[0]);
        } else {
          conditions.push(or(...tagConditions));
        }
      }

      return conditions.length === 1 ? conditions[0] : and(...conditions);
    };

    const fetchPage = async (usePublishAt: boolean) => {
      const filters = buildFilters(usePublishAt);

      timer.mark("query_page_start", { usePublishAt });
      const paginated = await db
        .select({
          id: opportunities.id,
          type: opportunities.type,
          title: opportunities.title,
          description: opportunities.description,
          images: opportunities.images,
          attachments: opportunities.attachments,
          tags: sql<string[]>`(
            SELECT coalesce(array_agg(t.name ORDER BY t.name), '{}')
            FROM ${tags} t
            WHERE t.id = ANY(${opportunities.tagIds})
          )`,
          location: opportunities.location,
          organiserInfo: opportunities.organiserInfo,
          startDate: opportunities.startDate,
          endDate: opportunities.endDate,
          applyLink: opportunities.applyLink,
          publishAt: usePublishAt
            ? opportunities.publishAt
            : sql<Date | null>`null`.as("publish_at"),
          isFlagged: opportunities.isFlagged,
          createdAt: opportunities.createdAt,
          updatedAt: opportunities.updatedAt,
          isVerified: opportunities.isVerified,
          isActive: opportunities.isActive,
          upvoteCount: opportunities.upvoteCount,
          upvoterIds: opportunities.upvoterIds,
          trending: opportunities.trending,
          featuredHome: opportunities.featuredHome,
          featuredHomeIndex: opportunities.featuredHomeIndex,
          displayIndex: opportunities.displayIndex,
          userId: opportunities.userId,
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
            role: user.role,
          },
        })
        .from(opportunities)
        .leftJoin(user, eq(opportunities.userId, user.id))
        .where(filters)
        .orderBy(
          featuredParam === "true"
            ? sql`COALESCE("opportunities"."featured_home_index", 999)`
            : sql`COALESCE("opportunities"."trending_index", 999)`,
          sql`CASE 
            WHEN COALESCE(${opportunities.endDate}, (${opportunities.createdAt} + INTERVAL '3 days')::date) < CURRENT_DATE THEN 1 
            ELSE 0 
          END`,
          desc(opportunities.createdAt)
        )
        .limit(validLimit + 1)
        .offset(validOffset);

      let totalCount = 0;
      if (includeTotal) {
        timer.mark("query_total_start", { usePublishAt });
        totalCount =
          (
            await db
              .select({ total: count() })
              .from(opportunities)
              .where(filters)
          )[0]?.total ?? 0;
        timer.mark("query_total_done", { totalCount, usePublishAt });
      }

      return { paginated, totalCount };
    };

    let paginated: Awaited<ReturnType<typeof fetchPage>>["paginated"];
    let totalCount: number;

    try {
      const result = await fetchPage(true);
      paginated = result.paginated;
      totalCount = result.totalCount ?? 0;
    } catch (error) {
      if (!isMissingPublishAtColumnError(error)) {
        throw error;
      }

      timer.mark("publish_at_fallback");
      const result = await fetchPage(false);
      paginated = result.paginated;
      totalCount = result.totalCount ?? 0;
    }

    // Handle pagination correctly using the extra row sentinel
    const hasMore = paginated.length > validLimit;
    const finalRows = hasMore ? paginated.slice(0, validLimit) : paginated;

    timer.mark("query_page_done", { rows: finalRows.length, hasMore });

    const currentUserId = session.user.id;
    const opportunitiesWithUpvote = finalRows.map((opp) => {
      let userHasUpvoted = false;
      if (currentUserId && Array.isArray(opp.upvoterIds)) {
        userHasUpvoted = opp.upvoterIds.includes(currentUserId);
      }
      return {
        ...opp,
        userHasUpvoted,
      };
    });

    timer.mark("transform_done", {
      rows: opportunitiesWithUpvote.length,
    });

    timer.end({ status: 200 });
    return NextResponse.json(
      {
        success: true,
        opportunities: opportunitiesWithUpvote,
        pagination: {
          limit: validLimit,
          offset: validOffset,
          total: totalCount,
          hasMore,
        },
        ...(includeTotal && { total: totalCount }),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching opportunities:", error);
    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
