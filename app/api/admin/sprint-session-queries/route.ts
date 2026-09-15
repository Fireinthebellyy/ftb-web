import { NextResponse } from "next/server";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sprintSessionQueries, sprintSessions, sprints, user } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, desc } from "drizzle-orm";

export async function GET(_request: Request) {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    !currentUser.currentUser?.id ||
    !canAccessAdminTab(currentUser.currentUser.role, "sprint-session-queries")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queries = await db
      .select({
        id: sprintSessionQueries.id,
        sessionId: sprintSessionQueries.sessionId,
        sessionTitle: sprintSessions.title,
        sprintId: sprintSessions.sprintId,
        sprintTitle: sprints.title,
        userId: sprintSessionQueries.userId,
        userName: user.name,
        userEmail: user.email,
        question: sprintSessionQueries.question,
        answer: sprintSessionQueries.answer,
        createdAt: sprintSessionQueries.createdAt,
        updatedAt: sprintSessionQueries.updatedAt,
      })
      .from(sprintSessionQueries)
      .leftJoin(sprintSessions, eq(sprintSessionQueries.sessionId, sprintSessions.id))
      .leftJoin(sprints, eq(sprintSessions.sprintId, sprints.id))
      .leftJoin(user, eq(sprintSessionQueries.userId, user.id))
      .orderBy(desc(sprintSessionQueries.createdAt));

    return NextResponse.json(queries);
  } catch (error) {
    console.error("Error fetching all sprint session queries:", error);
    return NextResponse.json(
      { error: "Failed to fetch queries" },
      { status: 500 }
    );
  }
}
