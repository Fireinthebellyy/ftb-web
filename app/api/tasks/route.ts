import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tasks } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  opportunityLink: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    if (!user || !user.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = taskSchema.parse(body);

    const newTask = await db
      .insert(tasks)
      .values({
        title: validatedData.title,
        description: validatedData.description,
        opportunityLink: validatedData.opportunityLink,
        completed: false,
        userId: user.currentUser.id,
      })
      .returning();

    return NextResponse.json(
      { success: true, task: newTask[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Full error object:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error creating task:", errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    if (!user || !user.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, user.currentUser.id))
      .orderBy(tasks.completed, tasks.createdAt);

    return NextResponse.json(
      { success: true, tasks: userTasks },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
