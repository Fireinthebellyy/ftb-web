import { NextResponse } from "next/server";
import { and, eq, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPaidSprintOrderForUser } from "@/lib/sprint-registration";
import { db } from "@/lib/db";
import { sprints, sprintSessions, sprintUpgradePlans, userSprintTargetPlans, sprintOrders } from "@/lib/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveSprint(identifier: string) {
  if (UUID_REGEX.test(identifier)) {
    return db.query.sprints.findFirst({
      where: eq(sprints.id, identifier),
    });
  }

  return db.query.sprints.findFirst({
    where: eq(sprints.slug, identifier),
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: identifier } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sprint = await resolveSprint(identifier);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const order = await getPaidSprintOrderForUser(session.user.id, sprint.id);
    if (!order) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const paidOrders = await db.query.sprintOrders.findMany({
      where: and(
        eq(sprintOrders.sprintId, sprint.id),
        eq(sprintOrders.userId, session.user.id),
        eq(sprintOrders.status, "paid")
      ),
    });

    const isVerified = paidOrders.some(o => o.isVerified);

    if (sprint.isVerificationRequired && !isVerified) {
      return NextResponse.json({
        sprint: { id: sprint.id, title: sprint.title },
        isLocked: true,
        isVerificationRequired: true,
        isVerified: false,
        sessions: [],
      });
    }

    const sessions = await db.query.sprintSessions.findMany({
      where: and(
        eq(sprintSessions.sprintId, sprint.id),
        eq(sprintSessions.isActive, true),
        eq(sprintSessions.showInDashboard, true)
      ),
      orderBy: (sprintSessions, { asc }) => [asc(sprintSessions.orderIndex)],
    });

    const hasAnyTierAccess = paidOrders.some((o) => Boolean(o.selectedTierId));
    const allPurchasedAddOnIds = new Set<string>();
    paidOrders.forEach((o) => {
      if (Array.isArray(o.selectedAddOnIds)) {
        (o.selectedAddOnIds as string[]).forEach((id) => allPurchasedAddOnIds.add(id));
      }
    });

    const paidUpgradePlanIds = new Set(paidOrders.map(o => o.selectedUpgradePlanId).filter(Boolean));
    let hasAllInOneUpgrade = false;
    if (paidUpgradePlanIds.size > 0) {
      try {
        const allInOnePlan = await db.query.sprintUpgradePlans.findFirst({
          where: and(
            eq(sprintUpgradePlans.sprintId, sprint.id),
            eq(sprintUpgradePlans.isAllInOne, true)
          ),
        });
        if (allInOnePlan && paidUpgradePlanIds.has(allInOnePlan.id)) {
          hasAllInOneUpgrade = true;
        }
      } catch (e) {
        console.warn("Error checking all-in-one sprint plan access:", e);
      }
    }

    const sessionsWithAccess = sessions.map((session) => {
      const isAccessible = hasAnyTierAccess || hasAllInOneUpgrade || allPurchasedAddOnIds.has(session.id);
      return {
        ...session,
        isAccessible,
      };
    });

    let upgradePlans: any[] = [];
    try {
      upgradePlans = await db.query.sprintUpgradePlans.findMany({
        where: and(
          eq(sprintUpgradePlans.sprintId, sprint.id),
          eq(sprintUpgradePlans.isActive, true)
        ),
        orderBy: [asc(sprintUpgradePlans.orderIndex)],
      });
    } catch (e) {
      console.warn("Sprint upgrade plans table query warning:", e);
      upgradePlans = [];
    }

    try {
      const targetRecords = await db.query.userSprintTargetPlans.findMany({
        where: and(
          eq(userSprintTargetPlans.userId, session.user.id),
          eq(userSprintTargetPlans.sprintId, sprint.id)
        ),
      });

      if (targetRecords && targetRecords.length > 0) {
        const disabledIds = new Set(
          targetRecords.filter((t) => t.isEnabled === false).map((t) => t.planId)
        );
        upgradePlans = upgradePlans.filter((plan) => !disabledIds.has(plan.id));
      }
    } catch (e) {
      console.warn("User sprint target plans table query warning:", e);
    }

    const isAllInOne = hasAnyTierAccess || hasAllInOneUpgrade;

    const accessibleCount = isAllInOne
      ? sessions.length
      : sessions.filter((s) => allPurchasedAddOnIds.has(s.id)).length;

    const totalAmountPaidPaise = paidOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
    const amountPaidRupees = totalAmountPaidPaise > 0 ? Math.round(totalAmountPaidPaise / 100) : 0;

    const currentPlanStatus = {
      purchasedSessionsCount: accessibleCount,
      totalSessionsCount: sessions.length,
      amountPaid: amountPaidRupees,
      isAllInOne,
      selectedAddOnIds: Array.from(allPurchasedAddOnIds),
    };

    return NextResponse.json({
      sprint: { id: sprint.id, title: sprint.title },
      userId: session.user.id,
      hasAccess: true,
      isLocked: false,
      isVerificationRequired: sprint.isVerificationRequired,
      isVerified: order.isVerified,
      sessions: sessionsWithAccess,
      currentPlanStatus,
      upgradePlans,
      hasExtendedResourceAccess: true,
    });
  } catch (error) {
    console.error("Error fetching sprint dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
