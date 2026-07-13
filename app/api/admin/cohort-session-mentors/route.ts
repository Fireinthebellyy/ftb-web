import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionMentors } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";

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

    if (!name?.trim()) {
      activityStatus = 400;
      activityError = "Name is required";
      return badRequest("Please provide a mentor name.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["name"],
      });
    }

    const newMentor = await db
      .insert(cohortSessionMentors)
      .values({
        contentId,
        name,
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
