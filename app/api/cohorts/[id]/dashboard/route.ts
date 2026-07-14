import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPaidCohortOrderForUser } from "@/lib/cohort-registration";
import { db } from "@/lib/db";
import { cohorts, cohortSessions } from "@/lib/schema";

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

    return NextResponse.json({
      cohort: { id: cohort.id, title: cohort.title },
      hasAccess: true,
      isLocked: false,
      isVerificationRequired: cohort.isVerificationRequired,
      isVerified: order.isVerified,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching cohort dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
