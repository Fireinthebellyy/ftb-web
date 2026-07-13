import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionContents } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, asc } from "drizzle-orm";

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
      !canAccessAdminTab(currentUser.currentUser.role, "cohorts")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const sessionId = paramsResolved.id;
    activityEntityId = sessionId;

    const contents = await db
      .select()
      .from(cohortSessionContents)
      .where(eq(cohortSessionContents.sessionId, sessionId))
      .orderBy(asc(cohortSessionContents.orderIndex));

    activityStatus = 200;
    return NextResponse.json(contents);
  } catch (error) {
    activityError = error;
    console.error("Error fetching session contents:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch session contents" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.content.list",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session",
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
      !canAccessAdminTab(currentUser.currentUser.role, "cohorts")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const sessionId = paramsResolved.id;
    activityEntityId = sessionId;

    const body = await request.json();
    const {
      sectionType,
      title,
      content,
      isUnlocked,
      orderIndex,
      liveSessionLink,
      videoUrl,
      lockedMessage,
      images,
    } = body;

    const validSectionTypes = ["live_session", "meet_mentor", "resources", "recording"];
    if (!validSectionTypes.includes(sectionType)) {
      activityStatus = 400;
      activityError = "Invalid section type";
      return badRequest("Please select a valid section type.", {
        code: "INVALID_SECTION_TYPE",
        fields: ["sectionType"],
      });
    }

    if (!title?.trim()) {
      activityStatus = 400;
      activityError = "Title is required";
      return badRequest("Please provide a title.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["title"],
      });
    }

    const newContent = await db
      .insert(cohortSessionContents)
      .values({
        sessionId,
        sectionType,
        title,
        content: content || null,
        isUnlocked: isUnlocked || false,
        orderIndex: orderIndex ?? 0,
        liveSessionLink: liveSessionLink || null,
        videoUrl: videoUrl || null,
        lockedMessage: lockedMessage || null,
        images: images || null,
      })
      .returning();

    activityAfterState = newContent[0];
    activityStatus = 201;
    return NextResponse.json(newContent[0], { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating session content:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create session content" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.content.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
