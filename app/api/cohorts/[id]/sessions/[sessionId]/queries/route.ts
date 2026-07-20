import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortSessionQueries } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const editQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

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
    const userId = currentUser.currentUser.id;

    // Only return the current user's queries
    const queries = await db
      .select()
      .from(cohortSessionQueries)
      .where(
        eq(cohortSessionQueries.sessionId, sessionId)
      )
      .orderBy(desc(cohortSessionQueries.createdAt));

    // Filter to only show current user's queries on client side
    const userQueries = queries.filter(q => q.userId === userId);

    return NextResponse.json(userQueries);
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const { sessionId: _sessionId } = paramsResolved;
    const userId = currentUser.currentUser.id;

    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("queryId");

    if (!queryId) {
      return NextResponse.json(
        { error: "Query ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = editQuestionSchema.parse(body);

    // Check if the query belongs to the current user
    const existingQuery = await db
      .select()
      .from(cohortSessionQueries)
      .where(
        and(
          eq(cohortSessionQueries.id, queryId),
          eq(cohortSessionQueries.userId, userId)
        )
      )
      .limit(1);

    if (existingQuery.length === 0) {
      return NextResponse.json(
        { error: "Query not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the question
    const updatedQuery = await db
      .update(cohortSessionQueries)
      .set({
        question: validatedData.question,
        updatedAt: new Date(),
      })
      .where(eq(cohortSessionQueries.id, queryId))
      .returning();

    return NextResponse.json(updatedQuery[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error editing question:", error);
    return NextResponse.json(
      { error: "Failed to edit question" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const { sessionId: _sessionId } = paramsResolved;
    const userId = currentUser.currentUser.id;

    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("queryId");

    if (!queryId) {
      return NextResponse.json(
        { error: "Query ID is required" },
        { status: 400 }
      );
    }

    // Check if the query belongs to the current user
    const existingQuery = await db
      .select()
      .from(cohortSessionQueries)
      .where(
        and(
          eq(cohortSessionQueries.id, queryId),
          eq(cohortSessionQueries.userId, userId)
        )
      )
      .limit(1);

    if (existingQuery.length === 0) {
      return NextResponse.json(
        { error: "Query not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the query
    await db
      .delete(cohortSessionQueries)
      .where(eq(cohortSessionQueries.id, queryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
