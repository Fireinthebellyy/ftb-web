import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortSessionQueries } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const { sessionId } = paramsResolved;

    const queries = await db
      .select()
      .from(cohortSessionQueries)
      .where(eq(cohortSessionQueries.sessionId, sessionId))
      .orderBy(desc(cohortSessionQueries.createdAt));

    return NextResponse.json(queries);
  } catch (error) {
    console.error("Error fetching session queries:", error);
    return NextResponse.json(
      { error: "Failed to fetch queries" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const { sessionId } = paramsResolved;
    const userId = currentUser.currentUser.id;

    const body = await request.json();
    const { question } = body;

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const newQuery = await db
      .insert(cohortSessionQueries)
      .values({
        sessionId,
        userId,
        question,
        answer: null,
      })
      .returning();

    return NextResponse.json(newQuery[0], { status: 201 });
  } catch (error) {
    console.error("Error creating query:", error);
    return NextResponse.json(
      { error: "Failed to create query" },
      { status: 500 }
    );
  }
}
