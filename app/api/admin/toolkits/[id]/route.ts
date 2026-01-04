import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;

    const body = await request.json();
    const {
      title,
      description,
      price,
      originalPrice,
      coverImageUrl,
      videoUrl,
      contentUrl,
      category,
      highlights,
      totalDuration,
      lessonCount,
      isActive,
    } = body;

    const updatedToolkit = await db
      .update(toolkits)
      .set({
        title,
        description,
        price,
        originalPrice,
        coverImageUrl,
        videoUrl,
        contentUrl,
        category,
        highlights,
        totalDuration,
        lessonCount,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(toolkits.id, toolkitId))
      .returning();

    if (!updatedToolkit || updatedToolkit.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    return NextResponse.json(updatedToolkit[0]);
  } catch (error) {
    console.error("Error updating toolkit:", error);
    return NextResponse.json(
      { error: "Failed to update toolkit" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;

    const deletedToolkit = await db
      .delete(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .returning();

    if (!deletedToolkit || deletedToolkit.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting toolkit:", error);
    return NextResponse.json(
      { error: "Failed to delete toolkit" },
      { status: 500 }
    );
  }
}
