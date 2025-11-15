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
import { opportunities, user } from "@/lib/schema";
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

    // Build insertData with careful array handling
    const insertData: any = {
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      userId: user.currentUser.id,
      isFlagged: false,
      isVerified: false,
      isActive: true,
    };

    // Handle arrays properly - only add if they have values
    if (
      validatedData.tags &&
      Array.isArray(validatedData.tags) &&
      validatedData.tags.length > 0
    ) {
      insertData.tags = validatedData.tags;
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

    const newOpportunity = await db
      .insert(opportunities)
      .values(insertData)
      .returning();

    return NextResponse.json(
      { success: true, data: newOpportunity[0] },
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
          FROM unnest(${opportunities.tags}) AS t(tag_value)
          WHERE lower(t.tag_value) = ${tag}
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
        tags: opportunities.tags,
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
        },
      })
      .from(opportunities)
      .leftJoin(user, eq(opportunities.userId, user.id))
      .where(filters)
      .orderBy(desc(opportunities.createdAt))
      .limit(validLimit)
      .offset(validOffset);

    const hasMore = validOffset + paginated.length < totalCount;

    return NextResponse.json(
      {
        success: true,
        opportunities: paginated,
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
