import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkitContentItems } from "@/lib/schema";
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
    const contentItemId = paramsResolved.id;

    const body = await request.json();
    const { title, type, content, vimeoVideoId, orderIndex } = body;

    const updatedContentItem = await db
      .update(toolkitContentItems)
      .set({
        title,
        type,
        content,
        vimeoVideoId,
        orderIndex,
        updatedAt: new Date(),
      })
      .where(eq(toolkitContentItems.id, contentItemId))
      .returning();

    if (!updatedContentItem || updatedContentItem.length === 0) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedContentItem[0]);
  } catch (error) {
    console.error("Error updating toolkit content item:", error);
    return NextResponse.json(
      { error: "Failed to update toolkit content item" },
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
    const contentItemId = paramsResolved.id;

    const deletedContentItem = await db
      .delete(toolkitContentItems)
      .where(eq(toolkitContentItems.id, contentItemId))
      .returning();

    if (!deletedContentItem || deletedContentItem.length === 0) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting toolkit content item:", error);
    return NextResponse.json(
      { error: "Failed to delete toolkit content item" },
      { status: 500 }
    );
  }
}
