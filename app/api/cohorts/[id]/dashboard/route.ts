import { NextResponse } from "next/server";
import { and, eq, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPaidCohortOrderForUser } from "@/lib/cohort-registration";
import { db } from "@/lib/db";
import { cohorts, cohortSessions, cohortUpgradePlans, userCohortTargetPlans } from "@/lib/schema";

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

    // Check if verification is required and if order is not verified
    if (cohort.isVerificationRequired && !order.isVerified) {
      return NextResponse.json({
        cohort: { id: cohort.id, title: cohort.title },
        isLocked: true,
        isVerificationRequired: true,
        isVerified: false,
        sessions: [],
      });
    }

    const sessions = await db.query.cohortSessions.findMany({
      where: and(eq(cohortSessions.cohortId, cohort.id), eq(cohortSessions.isActive, true)),
      orderBy: (cohortSessions, { asc }) => [asc(cohortSessions.orderIndex)],
    });

    // Add accessibility flag to each session
    // If user purchased individual sessions (selectedAddOnIds), only those are accessible
    // If user purchased a tier (selectedTierId), all sessions are accessible
    const sessionsWithAccess = sessions.map(session => {
      const isAccessible = order.selectedAddOnIds && Array.isArray(order.selectedAddOnIds) && order.selectedAddOnIds.length > 0
        ? order.selectedAddOnIds.includes(session.id)
        : true;
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

    const isAllInOne = Boolean(order.selectedTierId || !order.selectedAddOnIds || order.selectedAddOnIds.length === 0);

    const accessibleCount = isAllInOne
      ? sessions.length
      : sessions.filter((s) => order.selectedAddOnIds?.includes(s.id)).length;

    // Amount paid in order (convert paise to rupees if needed, assuming amountPaid in Rupees or Paise)
    // If order.amountPaid is > 100000, it might be in paise. Let's handle amount in rupees safely.
    const amountPaidRupees = order.amountPaid > 50000 ? Math.round(order.amountPaid / 100) : order.amountPaid;

    const currentPlanStatus = {
      purchasedSessionsCount: accessibleCount,
      totalSessionsCount: sessions.length,
      amountPaid: amountPaidRupees,
      isAllInOne,
      selectedAddOnIds: order.selectedAddOnIds || [],
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
