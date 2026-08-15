import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";

import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import {
  cohortUpgradePlans,
  userCohortTargetPlans,
  user,
} from "@/lib/schema";
import { getCurrentUser } from "@/server/users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: cohortId } = await params;
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");
    const userEmail = searchParams.get("email");

    if ((!userId || userId === "undefined" || userId === "null") && userEmail) {
      const foundUser = await db.query.user.findFirst({
        where: eq(user.email, userEmail),
      });
      if (foundUser) {
        userId = foundUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "userId or email parameter is required" }, { status: 400 });
    }

    // Fetch all active upgrade plans for this cohort
    const plans = await db.query.cohortUpgradePlans.findMany({
      where: and(
        eq(cohortUpgradePlans.cohortId, cohortId),
        eq(cohortUpgradePlans.isActive, true)
      ),
      orderBy: [asc(cohortUpgradePlans.orderIndex)],
    });

    // Fetch user target plan overrides
    const targetRecords = await db.query.userCohortTargetPlans.findMany({
      where: and(
        eq(userCohortTargetPlans.userId, userId),
        eq(userCohortTargetPlans.cohortId, cohortId)
      ),
    });

    const targetMap = new Map<string, boolean>();
    targetRecords.forEach((tr) => {
      targetMap.set(tr.planId, Boolean(tr.isEnabled));
    });

    const resultPlans = plans.map((plan) => {
      const hasOverride = targetMap.has(plan.id);
      return {
        ...plan,
        isEnabled: hasOverride ? targetMap.get(plan.id)! : true,
      };
    });

    return NextResponse.json({ plans: resultPlans });
  } catch (error) {
    console.error("Error fetching user target plans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

interface UpdateUserTargetBody {
  userId?: string;
  userEmail?: string;
  planId: string;
  isEnabled: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: cohortId } = await params;
    const body = (await request.json()) as UpdateUserTargetBody;
    let { userId, userEmail, planId, isEnabled } = body;

    if ((!userId || userId === "undefined" || userId === "null") && userEmail) {
      const foundUser = await db.query.user.findFirst({
        where: eq(user.email, userEmail),
      });
      if (foundUser) {
        userId = foundUser.id;
      }
    }

    if (!userId || !planId || typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify plan belongs to this cohort
    const plan = await db.query.cohortUpgradePlans.findFirst({
      where: and(
        eq(cohortUpgradePlans.id, planId),
        eq(cohortUpgradePlans.cohortId, cohortId)
      ),
    });

    if (!plan) {
      return NextResponse.json({ error: "Upgrade plan not found for this cohort" }, { status: 404 });
    }

    try {
      await db
        .insert(userCohortTargetPlans)
        .values({
          userId,
          cohortId,
          planId,
          isEnabled,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            userCohortTargetPlans.userId,
            userCohortTargetPlans.cohortId,
            userCohortTargetPlans.planId,
          ],
          set: {
            isEnabled,
            updatedAt: new Date(),
          },
        });
    } catch (dbErr) {
      console.error("Error updating user target plan DB:", dbErr);
      return NextResponse.json({ error: "Failed to update user target plan" }, { status: 500 });
    }

    void logAdminActivity({
      request,
      action: "admin.cohorts.user_targets.update",
      statusCode: 200,
      success: true,
      adminUserId: currentUser.currentUser.id,
      entityType: "cohort",
      entityId: cohortId,
      metadata: {
        action: "toggle_user_package_target",
        userId,
        planId,
        isEnabled,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user target plan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
