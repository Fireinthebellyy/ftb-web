import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { toolkitContentItems, toolkits } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, asc, sql } from "drizzle-orm";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;
    activityEntityId = toolkitId;

    const contentItems = await db
      .select()
      .from(toolkitContentItems)
      .where(eq(toolkitContentItems.toolkitId, toolkitId))
      .orderBy(asc(toolkitContentItems.orderIndex));

    activityStatus = 200;
    return NextResponse.json(contentItems);
  } catch (error) {
    activityError = error;
    console.error("Error fetching toolkit content items:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch toolkit content items" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.toolkits.content.list",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "toolkit",
      entityId: activityEntityId,
      error: activityError,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityAfterState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;
    activityEntityId = toolkitId;

    const body = await request.json();
    const { title, type, content, bunnyVideoUrl, orderIndex } = body;

    const missingFields: string[] = [];

    if (typeof title !== "string" || !title.trim()) {
      missingFields.push("title");
    }

    if (typeof type !== "string" || !type.trim()) {
      missingFields.push("type");
    }

    if (missingFields.length > 0) {
      activityStatus = 400;
      activityError = "Missing required toolkit content fields";
      return badRequest("Please provide title and content type.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: missingFields,
      });
    }

    if (!["article", "video"].includes(type)) {
      activityStatus = 400;
      activityError = "Invalid content type";
      return badRequest("Content type must be either article or video.", {
        code: "INVALID_CONTENT_TYPE",
        fields: ["type"],
      });
    }

    if (type === "article" && (!content || !String(content).trim())) {
      activityStatus = 400;
      activityError = "Article content is required";
      return badRequest("Article content is required for article lessons.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["content"],
      });
    }

    if (type === "video" && (!bunnyVideoUrl || !String(bunnyVideoUrl).trim())) {
      activityStatus = 400;
      activityError = "Video URL is required";
      return badRequest("Video URL is required for video lessons.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["bunnyVideoUrl"],
      });
    }

    const newContentItem = await db
      .insert(toolkitContentItems)
      .values({
        toolkitId,
        title,
        type,
        content,
        bunnyVideoUrl,
        orderIndex: orderIndex || 0,
      })
      .returning();

    await syncToolkitLessonCount(toolkitId);

    activityAfterState = newContentItem[0];
    activityStatus = 201;
    return NextResponse.json(newContentItem[0], { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating toolkit content item:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create toolkit content item" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.toolkits.content.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "toolkit",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
