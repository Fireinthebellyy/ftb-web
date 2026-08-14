import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  cohortUpgradePlans,
  userCohortTargetPlans,
  user,
} from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { logAdminActivity } from "@/lib/admin-activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
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
    let plans: any[] = [];
    try {
      plans = await db.query.cohortUpgradePlans.findMany({
        where: and(
          eq(cohortUpgradePlans.cohortId, cohortId),
          eq(cohortUpgradePlans.isActive, true)
        ),
        orderBy: [asc(cohortUpgradePlans.orderIndex)],
      });
    } catch {
      plans = [];
    }

    // Fetch user target plan overrides
    let targetRecords: any[] = [];
    try {
      targetRecords = await db.query.userCohortTargetPlans.findMany({
        where: and(
          eq(userCohortTargetPlans.userId, userId),
          eq(userCohortTargetPlans.cohortId, cohortId)
        ),
      });
    } catch {
      targetRecords = [];
    }

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cohortId } = await params;
    const body = await request.json();
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
      return NextResponse.json({ error: "Database table not ready" }, { status: 500 });
    }

    await logAdminActivity({
      adminId: session.user.id,
      action: "UPDATE",
      targetType: "COHORT",
      targetId: cohortId,
      details: {
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
