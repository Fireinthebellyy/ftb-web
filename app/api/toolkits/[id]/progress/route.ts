import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userToolkitProgress } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { and, eq } from "drizzle-orm";

// POST - Mark a content item as complete
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;
    const userSession = await getCurrentUser();

    if (!userSession || !userSession.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentItemId } = body;

    if (!contentItemId) {
      return NextResponse.json(
        { error: "contentItemId is required" },
        { status: 400 }
      );
    }

    // Check if already completed (idempotent - don't error, just return success)
    const existing = await db
      .select()
      .from(userToolkitProgress)
      .where(
        and(
          eq(userToolkitProgress.userId, userSession.currentUser.id),
          eq(userToolkitProgress.contentItemId, contentItemId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Already completed, return success without creating duplicate
      return NextResponse.json({
        success: true,
        progress: existing[0],
        alreadyCompleted: true,
      });
    }

    // Insert new progress record
    const newProgress = await db
      .insert(userToolkitProgress)
      .values({
        userId: userSession.currentUser.id,
        toolkitId: toolkitId,
        contentItemId: contentItemId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      progress: newProgress[0],
      alreadyCompleted: false,
    });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
