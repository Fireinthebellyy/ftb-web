import { db } from "@/lib/db";
import { ungatekeepComments } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { isFeatureEnabledServer } from "@/lib/feature-flags";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    // Check if comments feature is enabled
    if (!isFeatureEnabledServer("ENABLE_UNGATEKEEP_COMMENTS")) {
      return NextResponse.json(
        { error: "Comments feature is currently disabled" },
        { status: 503 }
      );
    }

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

    const { id: postId, commentId } = await params;

    // First, check if the comment exists and belongs to the current user
    const existingComment = await db
      .select()
      .from(ungatekeepComments)
      .where(
        and(
          eq(ungatekeepComments.id, commentId),
          eq(ungatekeepComments.postId, postId),
          eq(ungatekeepComments.userId, currentUser.currentUser.id)
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
      .delete(ungatekeepComments)
      .where(
        and(
          eq(ungatekeepComments.id, commentId),
          eq(ungatekeepComments.postId, postId),
          eq(ungatekeepComments.userId, currentUser.currentUser.id)
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
