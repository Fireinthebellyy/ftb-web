import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortMentors, cohortSessionContents, cohortSessions, cohortSessionMentors } from "@/lib/schema";
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
      !canAccessAdminTab(currentUser.currentUser.role, "cohorts")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      contentId,
      cohortMentorId,
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

    if (!cohortMentorId?.trim() && !name?.trim()) {
      activityStatus = 400;
      activityError = "Name is required when not linking to a cohort mentor";
      return badRequest("Please provide a mentor name or link to a cohort mentor.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["name"],
      });
    }

    // Enforce cohort ownership when linking to a cohort mentor
    if (cohortMentorId?.trim()) {
      const [content] = await db
        .select({ cohortId: cohortSessions.cohortId })
        .from(cohortSessionContents)
        .innerJoin(cohortSessions, eq(cohortSessionContents.sessionId, cohortSessions.id))
        .where(eq(cohortSessionContents.id, contentId))
        .limit(1);

      const [mentor] = await db
        .select({ cohortId: cohortMentors.cohortId })
        .from(cohortMentors)
        .where(eq(cohortMentors.id, cohortMentorId))
        .limit(1);

      if (!content || !mentor || content.cohortId !== mentor.cohortId) {
        activityStatus = 400;
        activityError = "Cohort mentor does not belong to this cohort";
        return badRequest("The selected mentor does not belong to this cohort.", {
          code: "COHORT_MISMATCH",
          fields: ["cohortMentorId"],
        });
      }
    }

    const newMentor = await db
      .insert(cohortSessionMentors)
      .values({
        contentId,
        cohortMentorId: cohortMentorId || null,
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
    console.error("Error creating mentor:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create mentor" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.mentors.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_mentor",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
