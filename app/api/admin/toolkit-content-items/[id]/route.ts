import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { toolkitContentItems, toolkits } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, sql } from "drizzle-orm";

async function syncToolkitLessonCount(toolkitId: string): Promise<void> {
  const result = await db
    .select({ lessonCount: sql<number>`count(*)` })
    .from(toolkitContentItems)
    .where(eq(toolkitContentItems.toolkitId, toolkitId));

  await db
    .update(toolkits)
    .set({
      lessonCount: Number(result[0]?.lessonCount ?? 0),
      updatedAt: new Date(),
    })
    .where(eq(toolkits.id, toolkitId));
}

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
      currentUser.currentUser.role !== "admin"
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const contentItemId = paramsResolved.id;
    activityEntityId = contentItemId;

    const existingContentItem = await db
      .select()
      .from(toolkitContentItems)
      .where(eq(toolkitContentItems.id, contentItemId))
      .limit(1);

    if (!existingContentItem.length) {
      activityStatus = 404;
      activityError = "Content item not found";
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingContentItem[0];

    const body = await request.json();
    const { title, type, content, bunnyVideoUrl, orderIndex } = body;

    const updatedContentItem = await db
      .update(toolkitContentItems)
      .set({
        title,
        type,
        content,
        bunnyVideoUrl,
        orderIndex,
        updatedAt: new Date(),
      })
      .where(eq(toolkitContentItems.id, contentItemId))
      .returning();

    if (!updatedContentItem || updatedContentItem.length === 0) {
      activityStatus = 404;
      activityError = "Content item not found";
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    activityAfterState = updatedContentItem[0];
    activityStatus = 200;
    return NextResponse.json(updatedContentItem[0]);
  } catch (error) {
    activityError = error;
    console.error("Error updating toolkit content item:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update toolkit content item" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.toolkits.content.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "toolkit_content_item",
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
      currentUser.currentUser.role !== "admin"
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const contentItemId = paramsResolved.id;
    activityEntityId = contentItemId;

    const existingContentItem = await db
      .select()
      .from(toolkitContentItems)
      .where(eq(toolkitContentItems.id, contentItemId))
      .limit(1);

    if (!existingContentItem.length) {
      activityStatus = 404;
      activityError = "Content item not found";
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingContentItem[0];

    const deletedContentItem = await db
      .delete(toolkitContentItems)
      .where(eq(toolkitContentItems.id, contentItemId))
      .returning();

    if (!deletedContentItem || deletedContentItem.length === 0) {
      activityStatus = 404;
      activityError = "Content item not found";
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    await syncToolkitLessonCount(deletedContentItem[0].toolkitId);

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting toolkit content item:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete toolkit content item" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.toolkits.content.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "toolkit_content_item",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}
