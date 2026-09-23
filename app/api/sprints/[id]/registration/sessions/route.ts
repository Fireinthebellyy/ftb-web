import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPaidSprintOrderForUser } from "@/lib/sprint-registration";
import { db } from "@/lib/db";
import { sprintOrders, sprints, sprintSessions } from "@/lib/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sessionsSchema = z.object({
  selectedSessionIds: z.array(z.string()).optional(),
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

    const body = await request.json();
    const parsed = sessionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid form data" },
        { status: 400 }
      );
    }

    const { selectedSessionIds } = parsed.data;

    if (selectedSessionIds && selectedSessionIds.length > 0) {
      const sprintSessionsData = await db.query.sprintSessions.findMany({
        where: and(
          eq(sprintSessions.sprintId, sprint.id),
          eq(sprintSessions.isActive, true)
        ),
      });

      const activeSessionIds = new Set(sprintSessionsData.map(s => s.id));
      const invalidSessionIds = selectedSessionIds.filter(id => !activeSessionIds.has(id));

      if (invalidSessionIds.length > 0) {
        return NextResponse.json(
          { error: "Some selected sessions are invalid or inactive" },
          { status: 400 }
        );
      }
    }

    await db
      .update(sprintOrders)
      .set({
        selectedSessionIds,
        registrationCompletedAt: new Date(),
      })
      .where(
        and(eq(sprintOrders.id, order.id), eq(sprintOrders.userId, session.user.id))
      );

    return NextResponse.json({
      success: true,
      message: "Sessions selection updated successfully",
    });
  } catch (error) {
    console.error("Error saving sprint session selection:", error);
    return NextResponse.json(
      { error: "Failed to save session selection" },
      { status: 500 }
    );
  }
}
