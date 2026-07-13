
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPaidCohortOrderForUser } from "@/lib/cohort-registration";
import { db } from "@/lib/db";
import {
  cohorts,
  cohortSessions,
  cohortSessionContents,
} from "@/lib/schema";

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

    const cohortSession = await db.query.cohortSessions.findFirst({
      where: and(eq(cohortSessions.id, sessionId), eq(cohortSessions.cohortId, cohort.id)),
    });

    if (!cohortSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // First fetch the content items
    const contentItems = await db.query.cohortSessionContents.findMany({
      where: eq(cohortSessionContents.sessionId, sessionId),
      orderBy: (cohortSessionContents, { asc }) => [asc(cohortSessionContents.orderIndex)],
    });

    // Then fetch mentors and resources separately and attach them
    const contentIds = contentItems.map(c => c.id);
    const mentors = await db.query.cohortSessionMentors.findMany({
      where: (cohortSessionMentors, { inArray }) =>
        inArray(cohortSessionMentors.contentId, contentIds),
      orderBy: (cohortSessionMentors, { asc }) => [asc(cohortSessionMentors.orderIndex)],
    });
    const resources = await db.query.cohortSessionResources.findMany({
      where: (cohortSessionResources, { inArray }) =>
        inArray(cohortSessionResources.contentId, contentIds),
      orderBy: (cohortSessionResources, { asc }) => [asc(cohortSessionResources.orderIndex)],
    });

    // Group mentors and resources by content id
    const mentorsByContent = new Map();
    for (const mentor of mentors) {
      if (!mentorsByContent.has(mentor.contentId)) {
        mentorsByContent.set(mentor.contentId, []);
      }
      mentorsByContent.get(mentor.contentId).push(mentor);
    }
    const resourcesByContent = new Map();
    for (const resource of resources) {
      if (!resourcesByContent.has(resource.contentId)) {
        resourcesByContent.set(resource.contentId, []);
      }
      resourcesByContent.get(resource.contentId).push(resource);
    }

    // Attach mentors and resources to contents
    const contents = contentItems.map(content => ({
      ...content,
      mentors: mentorsByContent.get(content.id) || [],
      resources: resourcesByContent.get(content.id) || [],
    }));

    return NextResponse.json({
      session: cohortSession,
      contents,
    });
  } catch (error) {
    console.error("Error fetching cohort session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
