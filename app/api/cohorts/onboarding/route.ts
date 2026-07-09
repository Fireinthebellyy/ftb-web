export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortOnboardingResponses, userToolkits, toolkits } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const toolkitId = url.searchParams.get("toolkitId");

    if (!toolkitId) {
      return NextResponse.json({ error: "Toolkit ID required" }, { status: 400 });
    }

    const onboarding = await db.query.cohortOnboardingResponses.findFirst({
      where: and(
        eq(cohortOnboardingResponses.userId, userId),
        eq(cohortOnboardingResponses.toolkitId, toolkitId)
      )
    });

    const toolkit = await db.query.toolkits.findFirst({
      where: eq(toolkits.id, toolkitId)
    });

    return NextResponse.json({ 
      onboarding,
      toolkit
    });
  } catch (error) {
    console.error("Cohort onboarding GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      toolkitId,
      stream,
      futureOptions,
      customOptions,
      mentorId,
      customAnswers,
    } = body;

    if (!toolkitId || !stream || !mentorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user actually purchased this cohort toolkit
    const purchase = await db.query.userToolkits.findFirst({
      where: and(
        eq(userToolkits.userId, userId),
        eq(userToolkits.toolkitId, toolkitId)
      ),
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "You haven't purchased this cohort." },
        { status: 403 }
      );
    }

    // Load toolkit details and validate it is a cohort and the mentor is assigned
    const toolkit = await db.query.toolkits.findFirst({
      where: eq(toolkits.id, toolkitId),
    });

    if (!toolkit) {
      return NextResponse.json(
        { error: "Cohort toolkit not found." },
        { status: 404 }
      );
    }

    if (!toolkit.isCohort) {
      return NextResponse.json(
        { error: "This toolkit is not a cohort." },
        { status: 400 }
      );
    }

    const mentorIds = toolkit.cohortDetails?.mentorIds;
    if (!mentorIds || !mentorIds.includes(mentorId)) {
      return NextResponse.json(
        { error: "Selected mentor is not assigned to this cohort." },
        { status: 400 }
      );
    }

    // Save onboarding responses
    await db.insert(cohortOnboardingResponses).values({
      userId,
      toolkitId,
      stream,
      futureOptions: futureOptions || [],
      customOptions: customOptions || "",
      mentorId,
      customAnswers: customAnswers || {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cohort onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
