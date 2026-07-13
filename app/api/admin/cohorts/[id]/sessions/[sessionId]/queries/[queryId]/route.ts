import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionQueries } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string; queryId: string }> }
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
    const queryId = paramsResolved.queryId;
    activityEntityId = queryId;

    const existingQuery = await db
      .select()
      .from(cohortSessionQueries)
      .where(eq(cohortSessionQueries.id, queryId))
      .limit(1);

    if (!existingQuery.length) {
      activityStatus = 404;
      activityError = "Query not found";
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingQuery[0];

    const body = await request.json();
    const { answer } = body;

    const updatedQuery = await db
      .update(cohortSessionQueries)
      .set({
        answer: answer ?? null,
        updatedAt: new Date(),
      })
      .where(eq(cohortSessionQueries.id, queryId))
      .returning();

    if (!updatedQuery.length) {
      activityStatus = 404;
      activityError = "Query not found";
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }

    activityAfterState = updatedQuery[0];
    activityStatus = 200;
    return NextResponse.json(updatedQuery[0]);
  } catch (error) {
    activityError = error;
    console.error("Error answering query:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to answer query" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.queries.answer",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_query",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
