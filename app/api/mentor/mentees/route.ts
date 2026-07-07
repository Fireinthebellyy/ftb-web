export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortOnboardingResponses, mentors, user } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.userId, session.user.id),
    });

    if (!mentorRecord) {
      return NextResponse.json({ error: "Forbidden: Not a mentor" }, { status: 403 });
    }

    const menteesResponses = await db
      .select({
        id: cohortOnboardingResponses.id,
        userId: cohortOnboardingResponses.userId,
        stream: cohortOnboardingResponses.stream,
        futureOptions: cohortOnboardingResponses.futureOptions,
        customOptions: cohortOnboardingResponses.customOptions,
        toolkitId: cohortOnboardingResponses.toolkitId,
        createdAt: cohortOnboardingResponses.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(cohortOnboardingResponses)
      .innerJoin(user, eq(cohortOnboardingResponses.userId, user.id))
      .where(eq(cohortOnboardingResponses.mentorId, mentorRecord.id));

    return NextResponse.json({ mentees: menteesResponses });
  } catch (error) {
    console.error("Mentor mentees GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
