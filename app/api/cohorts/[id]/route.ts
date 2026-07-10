import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohorts, cohortMentors, cohortFeatures, cohortTiers, cohortAddOns, cohortOrders } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const identifier = paramsResolved.id;

    let cohort;
    if (UUID_REGEX.test(identifier)) {
      cohort = await db.query.cohorts.findFirst({
        where: eq(cohorts.id, identifier),
      });
    } else {
      cohort = await db.query.cohorts.findFirst({
        where: eq(cohorts.slug, identifier),
      });
    }

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    const mentorsList = await db
      .select()
      .from(cohortMentors)
      .where(eq(cohortMentors.cohortId, cohort.id))
      .orderBy(cohortMentors.orderIndex);

    const featuresList = await db
      .select()
      .from(cohortFeatures)
      .where(eq(cohortFeatures.cohortId, cohort.id))
      .orderBy(cohortFeatures.orderIndex);

    const tiersList = await db
      .select()
      .from(cohortTiers)
      .where(eq(cohortTiers.cohortId, cohort.id))
      .orderBy(cohortTiers.orderIndex);

    const addonsList = await db
      .select()
      .from(cohortAddOns)
      .where(eq(cohortAddOns.cohortId, cohort.id))
      .orderBy(cohortAddOns.orderIndex);

    // Check purchase status
    let hasAccess = false;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user) {
        const order = await db.query.cohortOrders.findFirst({
          where: and(
            eq(cohortOrders.cohortId, cohort.id),
            eq(cohortOrders.userId, session.user.id),
            eq(cohortOrders.status, "paid")
          ),
        });
        if (order) {
          hasAccess = true;
        }
      }
    } catch (e) {
      console.log("No session or unauthorized checkout checking:", e);
    }

    return NextResponse.json({
      ...cohort,
      mentors: mentorsList,
      features: featuresList,
      tiers: tiersList,
      addons: addonsList,
      hasAccess,
    });
  } catch (error) {
    console.error("Error fetching cohort details:", error);
    return NextResponse.json(
      { error: "Failed to fetch cohort details" },
      { status: 500 }
    );
  }
}
