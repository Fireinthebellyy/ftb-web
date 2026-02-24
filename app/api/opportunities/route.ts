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
import { upsertTagsAndGetIds } from "@/lib/tags";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const opportunitySchema = z.object({
  type: z.enum(["hackathon", "grant", "competition", "ideathon"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  organiserInfo: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  publishAt: z
    .union([z.string().datetime(), z.literal(""), z.null()])
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

    // Check user role - users with role "user" need approval, members and admins can post directly
    const canPostDirectly = userRole === "admin" || userRole === "member";

    // Build insertData with careful array handling
    const insertData: any = {
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      userId: session.user.id,
      isFlagged: false,
      isVerified: false,
      // Set isActive based on user role - members and admins post directly, users need approval
      isActive: canPostDirectly,
    };

    // Handle arrays properly - only add if they have values
    if (validatedData.tags && Array.isArray(validatedData.tags)) {
      timer.mark("tags_upsert_start", {
        incomingTags: validatedData.tags.length,
      });
      const tagIds = await upsertTagsAndGetIds(validatedData.tags);
      timer.mark("tags_upsert_done", { resolvedTagIds: tagIds.length });
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

    // Optional string fields
    if (validatedData.location) {
      insertData.location = validatedData.location;
    }

    if (validatedData.organiserInfo) {
      insertData.organiserInfo = validatedData.organiserInfo;
    }

    // Date handling - convert to proper date format
    if (validatedData.startDate) {
      const startDate = new Date(validatedData.startDate);
      if (!isNaN(startDate.getTime())) {
        // Convert to YYYY-MM-DD format for PostgreSQL date type
        insertData.startDate = startDate.toISOString().split("T")[0];
      }
    }

    if (validatedData.endDate) {
      const endDate = new Date(validatedData.endDate);
      if (!isNaN(endDate.getTime())) {
        // Convert to YYYY-MM-DD format for PostgreSQL date type
        insertData.endDate = endDate.toISOString().split("T")[0];
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

    // Get pagination parameters from URL
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
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
      : [];

    // Validate pagination parameters
    const validLimit = Math.min(Math.max(limit, 1), 50); // Between 1 and 50
    const validOffset = Math.max(offset, 0); // Non-negative
    const idsParam = searchParams.get("ids");
    const ids = idsParam
      ? idsParam.split(",").map((id) => id.trim()).filter(Boolean)
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

      // Only show active (approved) opportunities to non-admin users
      // Admins can see all opportunities including pending ones
      if (sessionRole !== "admin") {
        conditions.push(eq(opportunities.isActive, true));
        if (usePublishAt) {
          conditions.push(
            or(
              isNull(opportunities.publishAt),
              lte(opportunities.publishAt, new Date())
            )
          );
        }
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
          tags: sql<string[]>`(
            SELECT coalesce(array_agg(t.name ORDER BY t.name), '{}')
            FROM ${tags} t
            WHERE t.id = ANY(${opportunities.tagIds})
          )`,
          location: opportunities.location,
          organiserInfo: opportunities.organiserInfo,
          startDate: opportunities.startDate,
          endDate: opportunities.endDate,
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
        .orderBy(desc(opportunities.createdAt))
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
    let totalCount = 0;

    try {
      const result = await fetchPage(true);
      paginated = result.paginated;
      totalCount = result.totalCount;
    } catch (error) {
      if (!isMissingPublishAtColumnError(error)) {
        throw error;
      }

      timer.mark("publish_at_fallback");
      const result = await fetchPage(false);
      paginated = result.paginated;
      totalCount = result.totalCount;
    }

    // (Resolved merge conflict: nothing needed here, this block is redundant and should be removed.)
    timer.mark("query_page_done", { rows: paginated.length });

    const hasMore = paginated.length > validLimit;
    const pageItems = hasMore ? paginated.slice(0, validLimit) : paginated;

    if (!includeTotal) {
      totalCount = hasMore
        ? validOffset + validLimit + 1
        : validOffset + pageItems.length;
    }

    // Calculate userHasUpvoted for each opportunity
    const currentUserId = session.user.id;
    const opportunitiesWithUpvote = pageItems.map((opp) => {
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
      hasMore,
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
