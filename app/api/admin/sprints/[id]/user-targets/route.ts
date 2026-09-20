import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import {
  sprintUpgradePlans,
  userSprintTargetPlans,
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
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId } = await params;
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

    const plans = await db.query.sprintUpgradePlans.findMany({
      where: and(
        eq(sprintUpgradePlans.sprintId, sprintId),
        eq(sprintUpgradePlans.isActive, true)
      ),
      orderBy: [asc(sprintUpgradePlans.orderIndex)],
    });

    const targetRecords = await db.query.userSprintTargetPlans.findMany({
      where: and(
        eq(userSprintTargetPlans.userId, userId),
        eq(userSprintTargetPlans.sprintId, sprintId)
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
    console.error("Error fetching user sprint target plans:", error);
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
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId } = await params;
    const body: UpdateUserTargetBody = await request.json();
    let targetUserId = body.userId;

    if ((!targetUserId || targetUserId === "undefined" || targetUserId === "null") && body.userEmail) {
      const foundUser = await db.query.user.findFirst({
        where: eq(user.email, body.userEmail),
      });
      if (foundUser) {
        targetUserId = foundUser.id;
      }
    }

    if (!targetUserId || !body.planId) {
      return NextResponse.json(
        { error: "userId/userEmail and planId are required" },
        { status: 400 }
      );
    }

    const existing = await db.query.userSprintTargetPlans.findFirst({
      where: and(
        eq(userSprintTargetPlans.userId, targetUserId),
        eq(userSprintTargetPlans.sprintId, sprintId),
        eq(userSprintTargetPlans.planId, body.planId)
      ),
    });

    let result;
    if (existing) {
      result = await db
        .update(userSprintTargetPlans)
        .set({
          isEnabled: body.isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(userSprintTargetPlans.id, existing.id))
        .returning();
    } else {
      result = await db
        .insert(userSprintTargetPlans)
        .values({
          userId: targetUserId,
          sprintId,
          planId: body.planId,
          isEnabled: body.isEnabled,
        })
        .returning();
    }

    void logAdminActivity({
      request,
      action: "admin.sprints.user_targets.update",
      statusCode: 200,
      success: true,
      adminUserId: currentUser.currentUser.id,
      entityType: "user_sprint_target_plan",
      entityId: result[0]?.id || null,
      afterState: result[0],
    });

    return NextResponse.json({ target: result[0] });
  } catch (error) {
    console.error("Error updating user sprint target plan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
