import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getPaidCohortOrderForUser,
  isCohortRegistrationComplete,
} from "@/lib/cohort-registration";
import { db } from "@/lib/db";
import { cohortOrders, cohorts } from "@/lib/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  college: z.string().trim().min(2, "College is required"),
  course: z.string().trim().min(2, "Course is required"),
  year: z.string().trim().min(1, "Year is required"),
  expectations: z
    .string()
    .trim()
    .min(10, "Please share what you are expecting from this cohort"),
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
        { error: "No paid registration found for this cohort" },
        { status: 403 }
      );
    }

    const completed = isCohortRegistrationComplete(order);

    return NextResponse.json({
      cohortId: cohort.id,
      cohortTitle: cohort.title,
      toolkitId: cohort.toolkitId,
      completed,
      registration: completed
        ? {
            name: order.registrationName,
            college: order.registrationCollege,
            course: order.registrationCourse,
            year: order.registrationYear,
            expectations: order.registrationExpectations,
          }
        : null,
      prefilledName: order.buyerName,
    });
  } catch (error) {
    console.error("Error fetching cohort registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration status" },
      { status: 500 }
    );
  }
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

    if (isCohortRegistrationComplete(order)) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        toolkitId: cohort.toolkitId,
      });
    }

    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid form data" },
        { status: 400 }
      );
    }

    const { name, college, course, year, expectations } = parsed.data;

    await db
      .update(cohortOrders)
      .set({
        registrationName: name,
        registrationCollege: college,
        registrationCourse: course,
        registrationYear: year,
        registrationExpectations: expectations,
        registrationCompletedAt: new Date(),
      })
      .where(
        and(eq(cohortOrders.id, order.id), eq(cohortOrders.userId, session.user.id))
      );

    return NextResponse.json({
      success: true,
      toolkitId: cohort.toolkitId,
    });
  } catch (error) {
    console.error("Error submitting cohort registration:", error);
    return NextResponse.json(
      { error: "Failed to submit registration form" },
      { status: 500 }
    );
  }
}
