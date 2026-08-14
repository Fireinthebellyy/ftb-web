import { NextResponse } from "next/server";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionQueries, cohortSessions, cohorts, user } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, desc } from "drizzle-orm";

export async function GET(_request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "session-queries")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all queries with session, cohort, and user information
    const queries = await db
      .select({
        id: cohortSessionQueries.id,
        sessionId: cohortSessionQueries.sessionId,
        sessionTitle: cohortSessions.title,
        cohortId: cohortSessions.cohortId,
        cohortTitle: cohorts.title,
        userId: cohortSessionQueries.userId,
        userName: user.name,
        userEmail: user.email,
        question: cohortSessionQueries.question,
        answer: cohortSessionQueries.answer,
        createdAt: cohortSessionQueries.createdAt,
        updatedAt: cohortSessionQueries.updatedAt,
      })
      .from(cohortSessionQueries)
      .leftJoin(cohortSessions, eq(cohortSessionQueries.sessionId, cohortSessions.id))
      .leftJoin(cohorts, eq(cohortSessions.cohortId, cohorts.id))
      .leftJoin(user, eq(cohortSessionQueries.userId, user.id))
      .orderBy(desc(cohortSessionQueries.createdAt));

    return NextResponse.json(queries);
  } catch (error) {
    console.error("Error fetching all session queries:", error);
    return NextResponse.json(
      { error: "Failed to fetch queries" },
      { status: 500 }
    );
  }
}
