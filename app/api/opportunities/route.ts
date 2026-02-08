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
} from "drizzle-orm";
import { opportunities, tags, user } from "@/lib/schema";
import { upsertTagsAndGetIds } from "@/lib/tags";
import { getCurrentUser } from "@/server/users";
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
});


export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    if (!user || !user.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = opportunitySchema.parse(body);

    // Check user role - users with role "user" need approval, members and admins can post directly
    const userRole = user.currentUser.role;
    const canPostDirectly = userRole === "admin" || userRole === "member";

    // Build insertData with careful array handling
    const insertData: any = {
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      userId: user.currentUser.id,
      isFlagged: false,
      isVerified: false,
      // Set isActive based on user role - members and admins post directly, users need approval
      isActive: canPostDirectly,
    };

    // Handle arrays properly - only add if they have values
    if (validatedData.tags && Array.isArray(validatedData.tags)) {
      const tagIds = await upsertTagsAndGetIds(validatedData.tags);
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

    // Date handling - preserve local timezone dates
    if (validatedData.startDate) {
      // Parse ISO string and extract date part in local timezone
      const startDate = new Date(validatedData.startDate);
      if (!isNaN(startDate.getTime())) {
        // Get local date components to avoid UTC conversion
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        insertData.startDate = `${year}-${month}-${day}`;
      }
    }

    if (validatedData.endDate) {
      // Parse ISO string and extract date part in local timezone
      const endDate = new Date(validatedData.endDate);
      if (!isNaN(endDate.getTime())) {
        // Get local date components to avoid UTC conversion
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        insertData.endDate = `${year}-${month}-${day}`;
      }
    }

    const newOpportunity = await db
      .insert(opportunities)
      .values(insertData)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newOpportunity[0],
        userRole: user.currentUser.role
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Full error object:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error creating opportunity:", errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin to determine what opportunities to show
    const isAdmin = currentUser.currentUser.role === "admin";

    // Get pagination parameters from URL
    const { searchParams } = new URL(req.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);
    const searchParam = searchParams.get("search");
    const typesParam = searchParams.get("types");
    const tagsParam = searchParams.get("tags");
    const limit = Number.isNaN(limitParam) ? 10 : limitParam;
    const offset = Number.isNaN(offsetParam) ? 0 : offsetParam;
    const searchTerm = searchParam ? searchParam.trim() : "";
    const rawTypes = typesParam
      ? typesParam.split(",").map((value) => value.trim()).filter(Boolean)
      : [];
    const allowedTypes = (opportunities.type.enumValues ?? []) as string[];
    const validTypes = rawTypes.filter((type) =>
      allowedTypes.includes(type)
    );
    const rawTags = tagsParam
      ? tagsParam
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
      : [];

    // Validate pagination parameters
    const validLimit = Math.min(Math.max(limit, 1), 50); // Between 1 and 50
    const validOffset = Math.max(offset, 0); // Non-negative

    const conditions: SQL<unknown>[] = [isNull(opportunities.deletedAt)];

    // Only show active (approved) opportunities to non-admin users
    // Admins can see all opportunities including pending ones
    if (!isAdmin) {
      conditions.push(eq(opportunities.isActive, true));
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
      const tagConditions = rawTags.map((tag) =>
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

    const filters =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const totalResult = await db
      .select({ total: count() })
      .from(opportunities)
      .where(filters);

    const totalCount = totalResult[0]?.total ?? 0;

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
      .limit(validLimit)
      .offset(validOffset);

    // Calculate userHasUpvoted for each opportunity
    const currentUserId = currentUser.currentUser.id;
    const opportunitiesWithUpvote = paginated.map((opp) => {
      let userHasUpvoted = false;
      if (currentUserId && Array.isArray(opp.upvoterIds)) {
        userHasUpvoted = opp.upvoterIds.includes(currentUserId);
      }
      return {
        ...opp,
        userHasUpvoted,
      };
    });

    const hasMore = validOffset + paginated.length < totalCount;

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
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
