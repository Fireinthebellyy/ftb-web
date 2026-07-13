import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessions, cohortSessionContents, cohortSessionMentors, cohortSessionResources, cohortSessionQueries } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, asc, inArray, desc } from "drizzle-orm";

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
    const cohortId = paramsResolved.id;
    activityEntityId = cohortId;

    const sessions = await db
      .select()
      .from(cohortSessions)
      .where(eq(cohortSessions.cohortId, cohortId))
      .orderBy(asc(cohortSessions.orderIndex));

    // Fetch contents for each session
    let allContents: any[] = [];
    if (sessions.length > 0) {
      allContents = await db
        .select()
        .from(cohortSessionContents)
        .where(inArray(cohortSessionContents.sessionId, sessions.map(s => s.id)))
        .orderBy(asc(cohortSessionContents.createdAt));
    }

    // Fetch mentors for all contents
    let allMentors: any[] = [];
    if (allContents.length > 0) {
      allMentors = await db
        .select()
        .from(cohortSessionMentors)
        .where(inArray(cohortSessionMentors.contentId, allContents.map(c => c.id)))
        .orderBy(asc(cohortSessionMentors.orderIndex));
    }

    // Fetch resources for all contents
    let allResources: any[] = [];
    if (allContents.length > 0) {
      allResources = await db
        .select()
        .from(cohortSessionResources)
        .where(inArray(cohortSessionResources.contentId, allContents.map(c => c.id)))
        .orderBy(asc(cohortSessionResources.orderIndex));
    }

    // Group contents by session id
    const contentsBySessionId = new Map();
    for (const content of allContents) {
      if (!contentsBySessionId.has(content.sessionId)) {
        contentsBySessionId.set(content.sessionId, []);
      }
      contentsBySessionId.get(content.sessionId).push(content);
    }

    // Group mentors by content id
    const mentorsByContentId = new Map();
    for (const mentor of allMentors) {
      if (!mentorsByContentId.has(mentor.contentId)) {
        mentorsByContentId.set(mentor.contentId, []);
      }
      mentorsByContentId.get(mentor.contentId).push(mentor);
    }

    // Group resources by content id
    const resourcesByContentId = new Map();
    for (const resource of allResources) {
      if (!resourcesByContentId.has(resource.contentId)) {
        resourcesByContentId.set(resource.contentId, []);
      }
      resourcesByContentId.get(resource.contentId).push(resource);
    }

    // Fetch queries for all sessions
    let allQueries: any[] = [];
    if (sessions.length > 0) {
      allQueries = await db
        .select()
        .from(cohortSessionQueries)
        .where(inArray(cohortSessionQueries.sessionId, sessions.map(s => s.id)))
        .orderBy(desc(cohortSessionQueries.createdAt));
    }

    // Group queries by session id
    const queriesBySessionId = new Map();
    for (const query of allQueries) {
      if (!queriesBySessionId.has(query.sessionId)) {
        queriesBySessionId.set(query.sessionId, []);
      }
      queriesBySessionId.get(query.sessionId).push(query);
    }

    // Combine sessions with their contents, mentors, resources, and queries
    const sessionsWithContents = sessions.map(session => ({
      ...session,
      contents: (contentsBySessionId.get(session.id) || []).map(content => ({
        ...content,
        mentors: mentorsByContentId.get(content.id) || [],
        resources: resourcesByContentId.get(content.id) || []
      })),
      queries: queriesBySessionId.get(session.id) || []
    }));

    activityStatus = 200;
    return NextResponse.json(sessionsWithContents);
  } catch (error) {
    activityError = error;
    console.error("Error fetching cohort sessions:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch cohort sessions" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.list",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort",
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
    const cohortId = paramsResolved.id;
    activityEntityId = cohortId;

    const body = await request.json();
    const { title, orderIndex, description } = body;

    if (!title?.trim()) {
      activityStatus = 400;
      activityError = "Title is required";
      return badRequest("Please provide a session title.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["title"],
      });
    }

    const newSession = await db
      .insert(cohortSessions)
      .values({
        cohortId,
        title,
        description,
        orderIndex: orderIndex ?? 0,
        isActive: true,
      })
      .returning();

    activityAfterState = newSession[0];
    activityStatus = 201;
    return NextResponse.json(newSession[0], { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating cohort session:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create cohort session" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
