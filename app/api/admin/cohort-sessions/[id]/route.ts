import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessions } from "@/lib/schema";
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
    const sessionId = paramsResolved.id;
    activityEntityId = sessionId;

    const existingSession = await db
      .select()
      .from(cohortSessions)
      .where(eq(cohortSessions.id, sessionId))
      .limit(1);

    if (!existingSession.length) {
      activityStatus = 404;
      activityError = "Session not found";
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingSession[0];

    const body = await request.json();
    const { title, orderIndex, isActive, description } = body;

    const updatedSession = await db
      .update(cohortSessions)
      .set({
        title,
        description,
        orderIndex,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(cohortSessions.id, sessionId))
      .returning();

    if (!updatedSession.length) {
      activityStatus = 404;
      activityError = "Session not found";
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    activityAfterState = updatedSession[0];
    activityStatus = 200;
    return NextResponse.json(updatedSession[0]);
  } catch (error) {
    activityError = error;
    console.error("Error updating cohort session:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update cohort session" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session",
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
    const sessionId = paramsResolved.id;
    activityEntityId = sessionId;

    const existingSession = await db
      .select()
      .from(cohortSessions)
      .where(eq(cohortSessions.id, sessionId))
      .limit(1);

    if (!existingSession.length) {
      activityStatus = 404;
      activityError = "Session not found";
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingSession[0];

    await db.delete(cohortSessions).where(eq(cohortSessions.id, sessionId));

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting cohort session:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete cohort session" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}
