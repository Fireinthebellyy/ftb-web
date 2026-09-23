import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  sprints,
  sprintSessions,
  sprintSessionContents,
  sprintOrders,
  sprintUpgradePlans,
} from "@/lib/schema";

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
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: identifier, sessionId } = await params;
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

    const paidOrders = await db.query.sprintOrders.findMany({
      where: and(
        eq(sprintOrders.sprintId, sprint.id),
        eq(sprintOrders.userId, session.user.id),
        eq(sprintOrders.status, "paid")
      ),
    });

    if (paidOrders.length === 0) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const sprintSession = await db.query.sprintSessions.findFirst({
      where: and(eq(sprintSessions.id, sessionId), eq(sprintSessions.sprintId, sprint.id)),
    });

    if (!sprintSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

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

    const isAccessible = hasAnyTierAccess || hasAllInOneUpgrade || allPurchasedAddOnIds.has(sessionId);

    if (!isAccessible) {
      return NextResponse.json(
        { error: "Session access not purchased" },
        { status: 403 }
      );
    }

    const contents = await db.query.sprintSessionContents.findMany({
      where: eq(sprintSessionContents.sessionId, sessionId),
      orderBy: (sprintSessionContents, { asc }) => [asc(sprintSessionContents.orderIndex)],
      with: {
        resources: {
          orderBy: (sprintSessionResources, { asc }) => [asc(sprintSessionResources.orderIndex)],
        },
        mentors: {
          orderBy: (sprintSessionMentors, { asc }) => [asc(sprintSessionMentors.orderIndex)],
          with: {
            sprintMentor: true,
          },
        },
      },
    });

    const resolvedContents = contents.map((c) => ({
      ...c,
      mentors: (c.mentors || []).map((m) => ({
        ...m,
        name: m.sprintMentor?.name ?? m.name,
        role: m.sprintMentor?.role ?? m.role,
        imageUrl: m.sprintMentor?.imageUrl ?? m.imageUrl,
        bio: m.sprintMentor?.bio ?? m.bio,
        linkedinUrl: m.sprintMentor?.link ?? m.linkedinUrl,
      })),
    }));

    return NextResponse.json({
      session: sprintSession,
      contents: resolvedContents,
    });
  } catch (error) {
    console.error("Error fetching sprint session content:", error);
    return NextResponse.json(
      { error: "Failed to fetch session content" },
      { status: 500 }
    );
  }
}
