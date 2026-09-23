import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintSessionQueries } from "@/lib/schema";
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

    const queries = await db
      .select()
      .from(sprintSessionQueries)
      .where(
        eq(sprintSessionQueries.sessionId, sessionId)
      )
      .orderBy(desc(sprintSessionQueries.createdAt));

    const userQueries = queries.filter(q => q.userId === userId);

    return NextResponse.json(userQueries);
  } catch (error) {
    console.error("Error fetching sprint session queries:", error);
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
      .insert(sprintSessionQueries)
      .values({
        sessionId,
        userId,
        question,
        answer: null,
      })
      .returning();

    return NextResponse.json(newQuery[0], { status: 201 });
  } catch (error) {
    console.error("Error creating sprint query:", error);
    return NextResponse.json(
      { error: "Failed to create query" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  _ctx: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = currentUser.currentUser.id;
    const body = await request.json();
    const { queryId, question } = body;

    if (!queryId) {
      return NextResponse.json({ error: "queryId is required" }, { status: 400 });
    }

    const parsed = editQuestionSchema.safeParse({ question });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid question" },
        { status: 400 }
      );
    }

    const existingQuery = await db.query.sprintSessionQueries.findFirst({
      where: and(
        eq(sprintSessionQueries.id, queryId),
        eq(sprintSessionQueries.userId, userId)
      ),
    });

    if (!existingQuery) {
      return NextResponse.json(
        { error: "Query not found or unauthorized" },
        { status: 404 }
      );
    }

    const updated = await db
      .update(sprintSessionQueries)
      .set({
        question: parsed.data.question.trim(),
        updatedAt: new Date(),
      })
      .where(eq(sprintSessionQueries.id, queryId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating sprint query:", error);
    return NextResponse.json(
      { error: "Failed to update query" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  _ctx: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = currentUser.currentUser.id;
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("queryId");

    if (!queryId) {
      return NextResponse.json({ error: "queryId parameter is required" }, { status: 400 });
    }

    const existingQuery = await db.query.sprintSessionQueries.findFirst({
      where: and(
        eq(sprintSessionQueries.id, queryId),
        eq(sprintSessionQueries.userId, userId)
      ),
    });

    if (!existingQuery) {
      return NextResponse.json(
        { error: "Query not found or unauthorized" },
        { status: 404 }
      );
    }

    await db
      .delete(sprintSessionQueries)
      .where(eq(sprintSessionQueries.id, queryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sprint query:", error);
    return NextResponse.json(
      { error: "Failed to delete query" },
      { status: 500 }
    );
  }
}
