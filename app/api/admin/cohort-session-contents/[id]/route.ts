import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionContents } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;
  let activityAfterState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "cohorts")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const contentId = paramsResolved.id;
    activityEntityId = contentId;

    const existingContent = await db
      .select()
      .from(cohortSessionContents)
      .where(eq(cohortSessionContents.id, contentId))
      .limit(1);

    if (!existingContent.length) {
      activityStatus = 404;
      activityError = "Content not found";
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingContent[0];

    const body = await request.json();
    const { title, content, isUnlocked, orderIndex, liveSessionLink, videoUrl, lockedMessage, images } = body;

    // Build update object with only provided fields
    const updateData: Partial<typeof cohortSessionContents.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content ?? null;
    if (isUnlocked !== undefined) updateData.isUnlocked = isUnlocked;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;
    if (liveSessionLink !== undefined) updateData.liveSessionLink = liveSessionLink ?? null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl ?? null;
    if (lockedMessage !== undefined) updateData.lockedMessage = lockedMessage ?? null;
    if (images !== undefined) updateData.images = images ?? null;

    const updatedContent = await db
      .update(cohortSessionContents)
      .set(updateData)
      .where(eq(cohortSessionContents.id, contentId))
      .returning();

    if (!updatedContent.length) {
      activityStatus = 404;
      activityError = "Content not found";
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    activityAfterState = updatedContent[0];
    activityStatus = 200;
    return NextResponse.json(updatedContent[0]);
  } catch (error) {
    activityError = error;
    console.error("Error updating session content:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update session content" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.content.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_content",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "cohorts")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const contentId = paramsResolved.id;
    activityEntityId = contentId;

    const existingContent = await db
      .select()
      .from(cohortSessionContents)
      .where(eq(cohortSessionContents.id, contentId))
      .limit(1);

    if (!existingContent.length) {
      activityStatus = 404;
      activityError = "Content not found";
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingContent[0];

    await db.delete(cohortSessionContents).where(eq(cohortSessionContents.id, contentId));

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting session content:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete session content" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.content.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_content",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}
