import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tasks } from "@/lib/schema";
import { getSessionCached } from "@/lib/auth-session-cache";
import { createApiTimer } from "@/lib/api-timing";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  opportunityLink: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const timer = createApiTimer("POST /api/tasks");

  try {
    if (!db) {
      timer.end({ status: 500, reason: "missing_db" });
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    timer.mark("auth_start");
    const session = await getSessionCached(await headers());
    timer.mark("auth_done", { hasSession: Boolean(session?.user?.id) });
    if (!session?.user?.id) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = taskSchema.parse(body);

    timer.mark("insert_start");
    const newTask = await db
      .insert(tasks)
      .values({
        title: validatedData.title,
        description: validatedData.description,
        opportunityLink: validatedData.opportunityLink,
        completed: false,
        userId: session.user.id,
      })
      .returning();
    timer.mark("insert_done", { rowCount: newTask.length });

    timer.end({ status: 201 });
    return NextResponse.json(
      { success: true, task: newTask[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Full error object:", error);
    if (error instanceof z.ZodError) {
      timer.end({ status: 400, reason: "validation_error" });
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error creating task:", errorMessage);

    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  const timer = createApiTimer("GET /api/tasks");

  try {
    if (!db) {
      timer.end({ status: 500, reason: "missing_db" });
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    timer.mark("auth_start");
    const session = await getSessionCached(await headers());
    timer.mark("auth_done", { hasSession: Boolean(session?.user?.id) });
    if (!session?.user?.id) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    timer.mark("select_start");
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id))
      .orderBy(tasks.completed, tasks.createdAt);
    timer.mark("select_done", { rows: userTasks.length });

    timer.end({ status: 200 });
    return NextResponse.json(
      { success: true, tasks: userTasks },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching tasks:", error);
    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json(
      {
        error: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
