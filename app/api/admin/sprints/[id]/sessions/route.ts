import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sprintSessions, sprintSessionContents, sprintSessionMentors, sprintSessionResources, sprintSessionQueries } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, asc, inArray, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const sprintId = paramsResolved.id;
    activityEntityId = sprintId;

    const sessions = await db
      .select()
      .from(sprintSessions)
      .where(eq(sprintSessions.sprintId, sprintId))
      .orderBy(asc(sprintSessions.orderIndex));

    let allContents: (typeof sprintSessionContents.$inferSelect)[] = [];
    if (sessions.length > 0) {
      allContents = await db
        .select()
        .from(sprintSessionContents)
        .where(inArray(sprintSessionContents.sessionId, sessions.map(s => s.id)))
        .orderBy(asc(sprintSessionContents.createdAt));
    }

    type ResolvedMentor = typeof sprintSessionMentors.$inferSelect & {
      name: string | null;
      role: string | null;
      imageUrl: string | null;
      bio: string | null;
      linkedinUrl: string | null;
    };
    let allMentors: ResolvedMentor[] = [];
    if (allContents.length > 0) {
      const rawMentors = await db.query.sprintSessionMentors.findMany({
        where: (ssm, { inArray }) => inArray(ssm.contentId, allContents.map(c => c.id)),
        with: { sprintMentor: true },
        orderBy: (ssm, { asc }) => [asc(ssm.orderIndex)],
      });
      allMentors = rawMentors.map(m => ({
        ...m,
        name: m.sprintMentor?.name ?? m.name,
        role: m.sprintMentor?.role ?? m.role,
        imageUrl: m.sprintMentor?.imageUrl ?? m.imageUrl,
        bio: m.sprintMentor?.bio ?? m.bio,
        linkedinUrl: m.sprintMentor?.link ?? m.linkedinUrl,
      }));
    }

    let allResources: (typeof sprintSessionResources.$inferSelect)[] = [];
    if (allContents.length > 0) {
      allResources = await db
        .select()
        .from(sprintSessionResources)
        .where(inArray(sprintSessionResources.contentId, allContents.map(c => c.id)))
        .orderBy(asc(sprintSessionResources.orderIndex));
    }

    const contentsBySessionId = new Map();
    for (const content of allContents) {
      if (!contentsBySessionId.has(content.sessionId)) {
        contentsBySessionId.set(content.sessionId, []);
      }
      contentsBySessionId.get(content.sessionId).push(content);
    }

    const mentorsByContentId = new Map();
    for (const mentor of allMentors) {
      if (!mentorsByContentId.has(mentor.contentId)) {
        mentorsByContentId.set(mentor.contentId, []);
      }
      mentorsByContentId.get(mentor.contentId).push(mentor);
    }

    const resourcesByContentId = new Map();
    for (const resource of allResources) {
      if (!resourcesByContentId.has(resource.contentId)) {
        resourcesByContentId.set(resource.contentId, []);
      }
      resourcesByContentId.get(resource.contentId).push(resource);
    }

    let allQueries: (typeof sprintSessionQueries.$inferSelect)[] = [];
    if (sessions.length > 0) {
      allQueries = await db
        .select()
        .from(sprintSessionQueries)
        .where(inArray(sprintSessionQueries.sessionId, sessions.map(s => s.id)))
        .orderBy(desc(sprintSessionQueries.createdAt));
    }

    const queriesBySessionId = new Map();
    for (const query of allQueries) {
      if (!queriesBySessionId.has(query.sessionId)) {
        queriesBySessionId.set(query.sessionId, []);
      }
      queriesBySessionId.get(query.sessionId).push(query);
    }

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
    console.error("Error fetching sprint sessions:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch sprint sessions" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.sprints.sessions.list",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "sprint",
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
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const sprintId = paramsResolved.id;
    activityEntityId = sprintId;

    const body = await request.json();
    const { title, orderIndex, description, showInDashboard, showInHome } = body;

    if (!title?.trim()) {
      activityStatus = 400;
      activityError = "Title is required";
      return badRequest("Please provide a session title.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["title"],
      });
    }

    const newSession = await db
      .insert(sprintSessions)
      .values({
        sprintId,
        title: title.trim(),
        description,
        orderIndex: orderIndex ?? 0,
        isActive: true,
        showInDashboard: showInDashboard ?? true,
        showInHome: showInHome ?? true,
      })
      .returning();

    activityAfterState = newSession[0];
    activityStatus = 201;
    return NextResponse.json(newSession[0], { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating sprint session:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create sprint session" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.sprints.sessions.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "sprint",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
