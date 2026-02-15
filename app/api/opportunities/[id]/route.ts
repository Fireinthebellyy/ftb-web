import { db, dbPool } from "@/lib/db";
import { eq } from "drizzle-orm";
import { opportunities, bookmarks, tasks } from "@/lib/schema";
import { upsertTagsAndGetIds } from "@/lib/tags";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateOpportunitySchema = z.object({
  type: z.enum(["hackathon", "grant", "competition", "ideathon"]).optional(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  organiserInfo: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateOpportunitySchema.parse(body);

    // Check if the opportunity exists and belongs to the current user
    const existingOpportunity = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    if (existingOpportunity.length === 0) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    if (existingOpportunity[0].userId !== user.currentUser.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this opportunity" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    // Handle optional fields
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type;
    }
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.images !== undefined) {
      updateData.images = validatedData.images;
    }
    if (validatedData.tags !== undefined) {
      updateData.tagIds = await upsertTagsAndGetIds(validatedData.tags);
    }
    if (validatedData.location !== undefined) {
      updateData.location = validatedData.location;
    }
    if (validatedData.organiserInfo !== undefined) {
      updateData.organiserInfo = validatedData.organiserInfo;
    }

    // Handle date fields - use local timezone to match POST handler
    if (validatedData.startDate !== undefined) {
      if (validatedData.startDate) {
        const startDate = new Date(validatedData.startDate);
        if (!isNaN(startDate.getTime())) {
          // Get local date components to avoid UTC conversion
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          updateData.startDate = `${year}-${month}-${day}`;
        }
      } else {
        updateData.startDate = null;
      }
    }

    if (validatedData.endDate !== undefined) {
      if (validatedData.endDate) {
        const endDate = new Date(validatedData.endDate);
        if (!isNaN(endDate.getTime())) {
          // Get local date components to avoid UTC conversion
          const year = endDate.getFullYear();
          const month = String(endDate.getMonth() + 1).padStart(2, '0');
          const day = String(endDate.getDate()).padStart(2, '0');
          updateData.endDate = `${year}-${month}-${day}`;
        }
      } else {
        updateData.endDate = null;
      }
    }

    // Update the opportunity
    const [updatedOpportunity] = await db
      .update(opportunities)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, id))
      .returning();

    return NextResponse.json(
      { success: true, data: updatedOpportunity },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating opportunity:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if the opportunity exists and belongs to the current user
    const existingOpportunity = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    if (existingOpportunity.length === 0) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    if (existingOpportunity[0].userId !== user.currentUser.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this opportunity" },
        { status: 403 }
      );
    }

    // Use transaction to ensure atomicity
    await dbPool.transaction(async (tx) => {
      // Delete ALL bookmarks for this opportunity (not just current user's)
      // This prevents dangling bookmarks pointing to soft-deleted opportunities
      await tx
        .delete(bookmarks)
        .where(eq(bookmarks.opportunityId, id));

      // Update tasks that reference this opportunity by title
      // Note: This is fragile - if title changes, tasks won't be updated
      // TODO: Consider adding opportunityId column to tasks table for proper FK relationship
      await tx
        .update(tasks)
        .set({ opportunityLink: null, updatedAt: new Date() })
        .where(eq(tasks.opportunityLink, existingOpportunity[0].title));

      // Soft delete by setting deletedAt timestamp
      await tx
        .update(opportunities)
        .set({
          deletedAt: new Date(),
          isActive: false,
        })
        .where(eq(opportunities.id, id));
    });

    return NextResponse.json(
      { message: "Opportunity deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
