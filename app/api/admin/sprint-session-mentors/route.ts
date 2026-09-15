import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sprintMentors, sprintSessionContents, sprintSessions, sprintSessionMentors } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      contentId,
      sprintMentorId,
      name,
      role,
      imageUrl,
      bio,
      linkedinUrl,
      otherLinks,
      orderIndex,
    } = body;

    if (!contentId?.trim()) {
      activityStatus = 400;
      activityError = "Content ID is required";
      return badRequest("Please provide a content ID.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["contentId"],
      });
    }

    if (!sprintMentorId?.trim() && !name?.trim()) {
      activityStatus = 400;
      activityError = "Name is required when not linking to a sprint mentor";
      return badRequest("Please provide a mentor name or link to a sprint mentor.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["name"],
      });
    }

    if (sprintMentorId?.trim()) {
      const [content] = await db
        .select({ sprintId: sprintSessions.sprintId })
        .from(sprintSessionContents)
        .innerJoin(sprintSessions, eq(sprintSessionContents.sessionId, sprintSessions.id))
        .where(eq(sprintSessionContents.id, contentId))
        .limit(1);

      const [mentor] = await db
        .select({ sprintId: sprintMentors.sprintId })
        .from(sprintMentors)
        .where(eq(sprintMentors.id, sprintMentorId))
        .limit(1);

      if (!content || !mentor || content.sprintId !== mentor.sprintId) {
        activityStatus = 400;
        activityError = "Sprint mentor does not belong to this sprint";
        return badRequest("The selected mentor does not belong to this sprint.", {
          code: "SPRINT_MISMATCH",
          fields: ["sprintMentorId"],
        });
      }
    }

    const newMentor = await db
      .insert(sprintSessionMentors)
      .values({
        contentId,
        sprintMentorId: sprintMentorId || null,
        name: name || null,
        role: role || null,
        imageUrl: imageUrl || null,
        bio: bio || null,
        linkedinUrl: linkedinUrl || null,
        otherLinks: otherLinks || [],
        orderIndex: orderIndex ?? 0,
      })
      .returning();

    activityAfterState = newMentor[0];
    activityEntityId = newMentor[0].id;
    activityStatus = 201;

    return NextResponse.json(newMentor[0], { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating sprint session mentor:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create session mentor" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.sprints.sessions.mentor.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "sprint_session_mentor",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
