import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionResources } from "@/lib/schema";
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
    const resourceId = paramsResolved.id;
    activityEntityId = resourceId;

    const existingResource = await db
      .select()
      .from(cohortSessionResources)
      .where(eq(cohortSessionResources.id, resourceId))
      .limit(1);

    if (!existingResource.length) {
      activityStatus = 404;
      activityError = "Resource not found";
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingResource[0];

    const body = await request.json();
    const {
      name,
      url,
      type,
      orderIndex,
    } = body;

    const validTypes = ["file", "video", "link", "image", "pdf", "ppt"];
    if (type && !validTypes.includes(type)) {
      activityStatus = 400;
      activityError = "Invalid type";
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

    const updatedResource = await db
      .update(cohortSessionResources)
      .set({
        name: name ?? existingResource[0].name,
        url: url ?? existingResource[0].url,
        type: type ?? existingResource[0].type,
        orderIndex: orderIndex ?? existingResource[0].orderIndex,
      })
      .where(eq(cohortSessionResources.id, resourceId))
      .returning();

    if (!updatedResource.length) {
      activityStatus = 404;
      activityError = "Resource not found";
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    activityAfterState = updatedResource[0];
    activityStatus = 200;
    return NextResponse.json(updatedResource[0]);
  } catch (error) {
    activityError = error;
    console.error("Error updating resource:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.resources.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_resource",
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
    const resourceId = paramsResolved.id;
    activityEntityId = resourceId;

    const existingResource = await db
      .select()
      .from(cohortSessionResources)
      .where(eq(cohortSessionResources.id, resourceId))
      .limit(1);

    if (!existingResource.length) {
      activityStatus = 404;
      activityError = "Resource not found";
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingResource[0];

    await db.delete(cohortSessionResources).where(eq(cohortSessionResources.id, resourceId));

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting resource:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.resources.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_resource",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}
