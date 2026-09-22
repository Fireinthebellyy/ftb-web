import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getPaidSprintOrderForUser,
  isSprintRegistrationComplete,
} from "@/lib/sprint-registration";
import { db } from "@/lib/db";
import { sprintOrders, sprints, sprintSessions } from "@/lib/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  college: z.string().trim().min(2, "College is required"),
  mobileNumber: z.string().trim().min(14,"Mobile number must be followed by 10 digits after +91 "),
  course: z.string().trim().min(2, "Course is required"),
  year: z.string().trim().min(1, "Year is required"),
  city: z.string().trim().min(2,"City is required"),
  expectations: z
    .string()
    .trim()
    .min(1, "Please share what you are expecting from this sprint"),
  consent: z.boolean().refine((value) => value === true, {
      message: "Consent is required",
    })
});

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
        { error: "No paid registration found for this sprint" },
        { status: 403 }
      );
    }

    const completed = isSprintRegistrationComplete(order);

    const sessions = await db.query.sprintSessions.findMany({
      where: and(
        eq(sprintSessions.sprintId, sprint.id),
        eq(sprintSessions.isActive, true)
      ),
      orderBy: (sprintSessions, { asc }) => [asc(sprintSessions.orderIndex)],
    });

    return NextResponse.json({
      sprintId: sprint.id,
      sprintTitle: sprint.title,
      toolkitId: sprint.toolkitId,
      completed,
      sessions,
      isVerificationRequired: Boolean(sprint.isVerificationRequired),
      registration: completed
        ? {
            name: order.registrationName,
            college: order.registrationCollege,
            mobileNumber: order.registrationMobileNumber,
            course: order.registrationCourse,
            year: order.registrationYear,
            city: order.registrationCity,
            expectations: order.registrationExpectations,
            consent: order.registrationConsent
          }
        : null,
      prefilledName: order.buyerName,
    });
  } catch (error) {
    console.error("Error fetching sprint registration:", error);
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

    const sprint = await resolveSprint(identifier);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const order = await getPaidSprintOrderForUser(session.user.id, sprint.id);
    if (!order) {
      return NextResponse.json(
        { error: "No paid registration found for this sprint" },
        { status: 403 }
      );
    }

    if (isSprintRegistrationComplete(order)) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        toolkitId: sprint.toolkitId,
      });
    }

    const body = await request.json();
    const result = registrationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid registration data" },
        { status: 400 }
      );
    }

    const { name, college, mobileNumber, course, year, city, expectations, consent } = result.data;

    // Check if sprint has any active sessions
    // const sprintSessionsData = await db.query.sprintSessions.findMany({
    //   where: and(
    //     eq(sprintSessions.sprintId, sprint.id),
    //     eq(sprintSessions.isActive, true)
    //   ),
    // });

    // const hasActiveSessions = sprintSessionsData.length > 0;

    await db
      .update(sprintOrders)
      .set({
        registrationName: name,
        registrationCollege: college,
        registrationMobileNumber: mobileNumber,
        registrationCourse: course,
        registrationYear: year,
        registrationCity: city,
        registrationExpectations: expectations,
        registrationConsent: consent,
        // ...(hasActiveSessions ? {} : { registrationCompletedAt: new Date() }),
        registrationCompletedAt: new Date(),
      })
      .where(
        and(eq(sprintOrders.id, order.id), eq(sprintOrders.userId, session.user.id))
      );

    return NextResponse.json({
      success: true,
      toolkitId: sprint.toolkitId,
      isVerificationRequired: Boolean(sprint.isVerificationRequired),
      // registrationComplete: !hasActiveSessions,
      registrationComplete: true
    });
  } catch (error) {
    console.error("Error submitting sprint registration:", error);
    return NextResponse.json(
      { error: "Failed to submit registration" },
      { status: 500 }
    );
  }
}
