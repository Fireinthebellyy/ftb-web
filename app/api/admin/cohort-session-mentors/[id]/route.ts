import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionMentors } from "@/lib/schema";
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
    const mentorId = paramsResolved.id;
    activityEntityId = mentorId;

    const existingMentor = await db
      .select()
      .from(cohortSessionMentors)
      .where(eq(cohortSessionMentors.id, mentorId))
      .limit(1);

    if (!existingMentor.length) {
      activityStatus = 404;
      activityError = "Mentor not found";
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingMentor[0];

    const body = await request.json();
    const {
      name,
      role,
      imageUrl,
      bio,
      linkedinUrl,
      otherLinks,
      orderIndex,
    } = body;

    const updatedMentor = await db
      .update(cohortSessionMentors)
      .set({
        name,
        role: role ?? null,
        imageUrl: imageUrl ?? null,
        bio: bio ?? null,
        linkedinUrl: linkedinUrl ?? null,
        otherLinks: otherLinks ?? [],
        orderIndex: orderIndex ?? 0,
      })
      .where(eq(cohortSessionMentors.id, mentorId))
      .returning();

    if (!updatedMentor.length) {
      activityStatus = 404;
      activityError = "Mentor not found";
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }

    activityAfterState = updatedMentor[0];
    activityStatus = 200;
    return NextResponse.json(updatedMentor[0]);
  } catch (error) {
    activityError = error;
    console.error("Error updating mentor:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update mentor" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.mentors.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_mentor",
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
    const mentorId = paramsResolved.id;
    activityEntityId = mentorId;

    const existingMentor = await db
      .select()
      .from(cohortSessionMentors)
      .where(eq(cohortSessionMentors.id, mentorId))
      .limit(1);

    if (!existingMentor.length) {
      activityStatus = 404;
      activityError = "Mentor not found";
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingMentor[0];

    await db.delete(cohortSessionMentors).where(eq(cohortSessionMentors.id, mentorId));

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting mentor:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete mentor" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.mentors.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_mentor",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}
