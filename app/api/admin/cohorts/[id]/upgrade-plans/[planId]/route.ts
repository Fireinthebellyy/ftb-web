import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortUpgradePlans } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
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

    const { id: cohortId, planId } = await params;
    activityEntityId = planId;

    const [existingPlan] = await db
      .select()
      .from(cohortUpgradePlans)
      .where(
        and(
          eq(cohortUpgradePlans.id, planId),
          eq(cohortUpgradePlans.cohortId, cohortId)
        )
      )
      .limit(1);

    if (!existingPlan) {
      activityStatus = 404;
      activityError = "Upgrade plan not found";
      return NextResponse.json(
        { error: "Upgrade plan not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingPlan;

    const body = await request.json();
    const {
      title,
      description,
      price,
      originalPrice,
      includedSessionCount,
      includedSessionIds,
      isAllInOne,
      badgeText,
      features,
      orderIndex,
      isActive,
    } = body;

    if (title !== undefined && !title?.trim()) {
      activityStatus = 400;
      activityError = "Title cannot be empty";
      return badRequest("Plan title cannot be empty", {
        code: "INVALID_FIELD",
        fields: ["title"],
      });
    }

    const [updatedPlan] = await db
      .update(cohortUpgradePlans)
      .set({
        title: title !== undefined ? title.trim() : existingPlan.title,
        description: description !== undefined ? description : existingPlan.description,
        price: price !== undefined ? price : existingPlan.price,
        originalPrice: originalPrice !== undefined ? originalPrice : existingPlan.originalPrice,
        includedSessionCount:
          includedSessionCount !== undefined
            ? includedSessionCount
            : existingPlan.includedSessionCount,
        includedSessionIds:
          includedSessionIds !== undefined
            ? includedSessionIds
            : existingPlan.includedSessionIds,
        isAllInOne: isAllInOne !== undefined ? isAllInOne : existingPlan.isAllInOne,
        badgeText: badgeText !== undefined ? badgeText : existingPlan.badgeText,
        features: features !== undefined ? features : existingPlan.features,
        orderIndex: orderIndex !== undefined ? orderIndex : existingPlan.orderIndex,
        isActive: isActive !== undefined ? isActive : existingPlan.isActive,
      })
      .where(eq(cohortUpgradePlans.id, planId))
      .returning();

    activityAfterState = updatedPlan;
    activityStatus = 200;
    return NextResponse.json(updatedPlan);
  } catch (error) {
    activityError = error;
    console.error("Error updating cohort upgrade plan:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update upgrade plan" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.upgrade_plans.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_upgrade_plan",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
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

    const { id: cohortId, planId } = await params;
    activityEntityId = planId;

    const [existingPlan] = await db
      .select()
      .from(cohortUpgradePlans)
      .where(
        and(
          eq(cohortUpgradePlans.id, planId),
          eq(cohortUpgradePlans.cohortId, cohortId)
        )
      )
      .limit(1);

    if (!existingPlan) {
      activityStatus = 404;
      activityError = "Upgrade plan not found";
      return NextResponse.json(
        { error: "Upgrade plan not found" },
        { status: 404 }
      );
    }
    activityBeforeState = existingPlan;

    await db
      .delete(cohortUpgradePlans)
      .where(eq(cohortUpgradePlans.id, planId));

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting cohort upgrade plan:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete upgrade plan" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.upgrade_plans.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_upgrade_plan",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}
