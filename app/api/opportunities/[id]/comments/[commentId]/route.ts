import { db } from "@/lib/db";
import { comments } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

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
        { error: "Comment not found or you don't have permission to delete it" },
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
      message: "Comment deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
