import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tasks } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  opportunityLink: z.string().optional(),
  completed: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const body = await req.json();
    const validatedData = updateTaskSchema.parse(body);

    const updates: any = {
      updatedAt: new Date(),
    };

    if (validatedData.title !== undefined) updates.title = validatedData.title;
    if (validatedData.description !== undefined)
      updates.description = validatedData.description;
    if (validatedData.opportunityLink !== undefined)
      updates.opportunityLink = validatedData.opportunityLink;
    if (validatedData.completed !== undefined)
      updates.completed = validatedData.completed;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json(
        { error: "No update fields provided" },
        { status: 400 }
      );
    }

    const updatedTask = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (updatedTask[0].userId !== user.currentUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { success: true, task: updatedTask[0] },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const deletedTask = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (deletedTask.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (deletedTask[0].userId !== user.currentUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
