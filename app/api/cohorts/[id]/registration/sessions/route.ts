import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPaidCohortOrderForUser } from "@/lib/cohort-registration";
import { db } from "@/lib/db";
import { cohortOrders, cohorts } from "@/lib/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sessionsSchema = z.object({
  selectedSessionIds: z.array(z.string()).min(1, "Please select at least one session"),
});

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

export async function POST(
  request: Request,
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
        { error: "No paid registration found for this cohort" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = sessionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid form data" },
        { status: 400 }
      );
    }

    const { selectedSessionIds } = parsed.data;

    await db
      .update(cohortOrders)
      .set({
        selectedSessionIds,
      })
      .where(
        and(eq(cohortOrders.id, order.id), eq(cohortOrders.userId, session.user.id))
      );

    return NextResponse.json({
      success: true,
      toolkitId: cohort.toolkitId,
    });
  } catch (error) {
    console.error("Error saving session selections:", error);
    return NextResponse.json(
      { error: "Failed to save session selections" },
      { status: 500 }
    );
  }
}
