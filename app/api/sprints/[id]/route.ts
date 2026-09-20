import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprints, sprintMentors, sprintFeatures, sprintTiers, sprintAddOns, sprintOrders, sprintSessions, sprintFaqs } from "@/lib/schema";
import { eq, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isSprintRegistrationComplete } from "@/lib/sprint-registration";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const identifier = paramsResolved.id;

    let sprint;
    if (UUID_REGEX.test(identifier)) {
      sprint = await db.query.sprints.findFirst({
        where: eq(sprints.id, identifier),
      });
    } else {
      sprint = await db.query.sprints.findFirst({
        where: eq(sprints.slug, identifier),
      });
    }

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const mentorsList = await db
      .select()
      .from(sprintMentors)
      .where(eq(sprintMentors.sprintId, sprint.id))
      .orderBy(sprintMentors.orderIndex);

    const featuresList = await db
      .select()
      .from(sprintFeatures)
      .where(eq(sprintFeatures.sprintId, sprint.id))
      .orderBy(sprintFeatures.orderIndex);

    const tiersList = await db
      .select()
      .from(sprintTiers)
      .where(eq(sprintTiers.sprintId, sprint.id))
      .orderBy(sprintTiers.orderIndex);

    const addonsList = await db
      .select()
      .from(sprintAddOns)
      .where(eq(sprintAddOns.sprintId, sprint.id))
      .orderBy(sprintAddOns.orderIndex);

    const sessionsList = await db
      .select()
      .from(sprintSessions)
      .where(and(
        eq(sprintSessions.sprintId, sprint.id),
        eq(sprintSessions.isActive, true),
        eq(sprintSessions.showInHome, true)
      ))
      .orderBy(sprintSessions.orderIndex);

    const faqsList = await db
      .select()
      .from(sprintFaqs)
      .where(and(
        eq(sprintFaqs.sprintId, sprint.id),
        eq(sprintFaqs.isActive, true)
      ))
      .orderBy(sprintFaqs.orderIndex);

    let hasAccess = false;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user) {
        const orders = await db.query.sprintOrders.findMany({
          where: and(
            eq(sprintOrders.sprintId, sprint.id),
            eq(sprintOrders.status, "paid"),
            or(
              eq(sprintOrders.userId, session.user.id),
              session.user.email ? eq(sprintOrders.buddyEmail, session.user.email.trim().toLowerCase()) : undefined
            )
          ),
        });
        if (orders.length > 0) {
          hasAccess = orders.some(o => isSprintRegistrationComplete(o));
        }
      }
    } catch (e) {
      console.log("No session or unauthorized checkout checking:", e);
    }

    return NextResponse.json({
      ...sprint,
      mentors: mentorsList,
      features: featuresList,
      tiers: tiersList,
      addons: addonsList,
      sessions: sessionsList,
      faqs: faqsList,
      hasAccess,
    });
  } catch (error) {
    console.error("Error fetching sprint details:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprint details" },
      { status: 500 }
    );
  }
}
