import { NextResponse } from "next/server";
import { and, eq, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPaidCohortOrderForUser } from "@/lib/cohort-registration";
import { db } from "@/lib/db";
import { cohorts, cohortSessions, cohortUpgradePlans, userCohortTargetPlans, cohortOrders } from "@/lib/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveCohort(identifier: string) {
  if (UUID_REGEX.test(identifier)) {
    return db.query.cohorts.findFirst({
      where: eq(cohorts.id, identifier),
    });
  }

  return db.query.cohorts.findFirst({
    where: eq(cohorts.slug, identifier),
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

    const cohort = await resolveCohort(identifier);
    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    const order = await getPaidCohortOrderForUser(session.user.id, cohort.id);
    if (!order) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const paidOrders = await db.query.cohortOrders.findMany({
      where: and(
        eq(cohortOrders.cohortId, cohort.id),
        eq(cohortOrders.userId, session.user.id),
        eq(cohortOrders.status, "paid")
      ),
    });

    const isVerified = paidOrders.some(o => o.isVerified);

    // Check if verification is required and if user has no verified order
    if (cohort.isVerificationRequired && !isVerified) {
      return NextResponse.json({
        cohort: { id: cohort.id, title: cohort.title },
        isLocked: true,
        isVerificationRequired: true,
        isVerified: false,
        sessions: [],
      });
    }

    const sessions = await db.query.cohortSessions.findMany({
      where: and(
        eq(cohortSessions.cohortId, cohort.id),
        eq(cohortSessions.isActive, true),
        eq(cohortSessions.showInDashboard, true)
      ),
      orderBy: (cohortSessions, { asc }) => [asc(cohortSessions.orderIndex)],
    });

    // Aggregate access across all paid orders
    const hasAnyTierAccess = paidOrders.some((o) => Boolean(o.selectedTierId));
    const allPurchasedAddOnIds = new Set<string>();
    paidOrders.forEach((o) => {
      if (Array.isArray(o.selectedAddOnIds)) {
        o.selectedAddOnIds.forEach((id) => allPurchasedAddOnIds.add(id));
      }
    });

    // Check if user has purchased an all-in-one upgrade plan
    const paidUpgradePlanIds = new Set(paidOrders.map(o => o.selectedUpgradePlanId).filter(Boolean));
    let hasAllInOneUpgrade = false;
    if (paidUpgradePlanIds.size > 0) {
      try {
        const allInOnePlan = await db.query.cohortUpgradePlans.findFirst({
          where: and(
            eq(cohortUpgradePlans.cohortId, cohort.id),
            eq(cohortUpgradePlans.isAllInOne, true)
          ),
        });
        if (allInOnePlan && paidUpgradePlanIds.has(allInOnePlan.id)) {
          hasAllInOneUpgrade = true;
        }
      } catch (e) {
        console.warn("Error checking all-in-one plan access:", e);
      }
    }

    const sessionsWithAccess = sessions.map((session) => {
      const isAccessible = hasAnyTierAccess || hasAllInOneUpgrade || allPurchasedAddOnIds.has(session.id);
      return {
        ...session,
        isAccessible,
      };
    });

    // Fetch active upgrade plans for this cohort (safely handle if table not migrated yet)
    let upgradePlans: any[] = [];
    try {
      upgradePlans = await db.query.cohortUpgradePlans.findMany({
        where: and(
          eq(cohortUpgradePlans.cohortId, cohort.id),
          eq(cohortUpgradePlans.isActive, true)
        ),
        orderBy: [asc(cohortUpgradePlans.orderIndex)],
      });
    } catch (e) {
      console.warn("Cohort upgrade plans table query warning:", e);
      upgradePlans = [];
    }

    // Filter upgrade plans targeting this specific user
    try {
      const targetRecords = await db.query.userCohortTargetPlans.findMany({
        where: and(
          eq(userCohortTargetPlans.userId, session.user.id),
          eq(userCohortTargetPlans.cohortId, cohort.id)
        ),
      });

      if (targetRecords && targetRecords.length > 0) {
        const disabledIds = new Set(
          targetRecords.filter((t) => t.isEnabled === false).map((t) => t.planId)
        );
        upgradePlans = upgradePlans.filter((plan) => !disabledIds.has(plan.id));
      }
    } catch (e) {
      console.warn("User cohort target plans table query warning:", e);
    }

    const isAllInOne = hasAnyTierAccess || hasAllInOneUpgrade;

    const accessibleCount = isAllInOne
      ? sessions.length
      : sessions.filter((s) => allPurchasedAddOnIds.has(s.id)).length;

    // sum total amount paid across orders
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
      cohort: { id: cohort.id, title: cohort.title },
      hasAccess: true,
      isLocked: false,
      isVerificationRequired: cohort.isVerificationRequired,
      isVerified: order.isVerified,
      sessions: sessionsWithAccess,
      currentPlanStatus,
      upgradePlans,
    });
  } catch (error) {
    console.error("Error fetching cohort dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
