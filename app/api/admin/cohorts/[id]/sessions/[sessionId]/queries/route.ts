import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionQueries, user } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const answerQuerySchema = z.object({
  answer: z.string().min(1, "Answer is required"),
});

const editAnswerSchema = z.object({
  queryId: z.string().min(1, "Query ID is required"),
  answer: z.string().optional(),
});

const _deleteQuerySchema = z.object({
  queryId: z.string().min(1, "Query ID is required"),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "cohorts")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const { sessionId } = paramsResolved;

    // Fetch all queries for this session with user info
    const queries = await db
      .select({
        id: cohortSessionQueries.id,
        sessionId: cohortSessionQueries.sessionId,
        userId: cohortSessionQueries.userId,
        question: cohortSessionQueries.question,
        answer: cohortSessionQueries.answer,
        createdAt: cohortSessionQueries.createdAt,
        updatedAt: cohortSessionQueries.updatedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(cohortSessionQueries)
      .leftJoin(user, eq(cohortSessionQueries.userId, user.id))
      .where(eq(cohortSessionQueries.sessionId, sessionId))
      .orderBy(desc(cohortSessionQueries.createdAt));

    return NextResponse.json(queries);
  } catch (error) {
    console.error("Error fetching session queries:", error);
    return NextResponse.json(
      { error: "Failed to fetch queries" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
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
    const { sessionId: _sessionId } = paramsResolved;

    const body = await request.json();
    const { queryId, answer } = body;
    activityEntityId = queryId;

    if (!queryId || !answer?.trim()) {
      activityStatus = 400;
      activityError = "Query ID and answer are required";
      return NextResponse.json(
        { error: "Query ID and answer are required" },
        { status: 400 }
      );
    }

    const validatedData = answerQuerySchema.parse({ answer });

    // Get existing query for activity log
    const existingQuery = await db
      .select()
      .from(cohortSessionQueries)
      .where(eq(cohortSessionQueries.id, queryId))
      .limit(1);
    
    if (existingQuery.length > 0) {
      activityBeforeState = existingQuery[0];
    }

    // Update the query with the answer
    const updatedQuery = await db
      .update(cohortSessionQueries)
      .set({
        answer: validatedData.answer,
        updatedAt: new Date(),
      })
      .where(eq(cohortSessionQueries.id, queryId))
      .returning();

    if (updatedQuery.length === 0) {
      activityStatus = 404;
      activityError = "Query not found";
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    activityAfterState = updatedQuery[0];
    activityStatus = 200;
    return NextResponse.json(updatedQuery[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      activityStatus = 400;
      activityError = error;
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
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

export async function PUT(
  request: Request,
  { params: _params }: { params: Promise<{ id: string; sessionId: string }> }
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

    const body = await request.json();
    const validatedData = editAnswerSchema.parse(body);
    activityEntityId = validatedData.queryId;

    // Get existing query for activity log
    const existingQuery = await db
      .select()
      .from(cohortSessionQueries)
      .where(eq(cohortSessionQueries.id, validatedData.queryId))
      .limit(1);

    if (existingQuery.length === 0) {
      activityStatus = 404;
      activityError = "Query not found";
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    activityBeforeState = existingQuery[0];

    // Update the answer
    const updatedQuery = await db
      .update(cohortSessionQueries)
      .set({
        answer: validatedData.answer,
        updatedAt: new Date(),
      })
      .where(eq(cohortSessionQueries.id, validatedData.queryId))
      .returning();

    activityAfterState = updatedQuery[0];
    activityStatus = 200;
    return NextResponse.json(updatedQuery[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      activityStatus = 400;
      activityError = error;
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    activityError = error;
    console.error("Error editing answer:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to edit answer" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.queries.edit_answer",
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

export async function DELETE(
  request: Request,
  { params: _params }: { params: Promise<{ id: string; sessionId: string }> }
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

    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("queryId");

    if (!queryId) {
      activityStatus = 400;
      activityError = "Query ID is required";
      return NextResponse.json(
        { error: "Query ID is required" },
        { status: 400 }
      );
    }

    activityEntityId = queryId;

    // Get existing query for activity log
    const existingQuery = await db
      .select()
      .from(cohortSessionQueries)
      .where(eq(cohortSessionQueries.id, queryId))
      .limit(1);

    if (existingQuery.length === 0) {
      activityStatus = 404;
      activityError = "Query not found";
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    activityBeforeState = existingQuery[0];

    // Delete the query (and answer)
    await db
      .delete(cohortSessionQueries)
      .where(eq(cohortSessionQueries.id, queryId));

    activityAfterState = null;
    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting query:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete query" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.queries.delete",
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
