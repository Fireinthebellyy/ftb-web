import { db } from "@/lib/db";
import { eq, isNull } from "drizzle-orm";
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

export async function GET(_req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    // Method 1: Using leftJoin (recommended)
    const allOpportunities = await db
      .select({
        // Opportunity fields
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
      .where(isNull(opportunities.deletedAt))
      .leftJoin(user, eq(opportunities.userId, user.id));

    return NextResponse.json(
      { success: true, opportunities: allOpportunities },
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
