import { db } from "@/lib/db";
import { comments, opportunities } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, lte, or } from "drizzle-orm";

async function isOpportunityPubliclyVisible(opportunityId: string) {
  const rows = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(
      and(
        eq(opportunities.id, opportunityId),
        isNull(opportunities.deletedAt),
        eq(opportunities.isActive, true),
        or(
          isNull(opportunities.publishAt),
          lte(opportunities.publishAt, new Date())
        )
      )
    )
    .limit(1);

  return rows.length > 0;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser?.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: opportunityId, commentId } = await params;

    const isVisible = await isOpportunityPubliclyVisible(opportunityId);
    if (!isVisible) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // First, check if the comment exists and belongs to the current user
    const existingComment = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.opportunityId, opportunityId),
          eq(comments.userId, currentUser.currentUser.id)
        )
      )
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        {
          error: "Comment not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Delete the comment
    await db
      .delete(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.opportunityId, opportunityId),
          eq(comments.userId, currentUser.currentUser.id)
        )
      );

    return NextResponse.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
