import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkitContentItems } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, asc } from "drizzle-orm";

export async function GET(
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

    const contentItems = await db
      .select()
      .from(toolkitContentItems)
      .where(eq(toolkitContentItems.toolkitId, toolkitId))
      .orderBy(asc(toolkitContentItems.orderIndex));

    return NextResponse.json(contentItems);
  } catch (error) {
    console.error("Error fetching toolkit content items:", error);
    return NextResponse.json(
      { error: "Failed to fetch toolkit content items" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { title, type, content, vimeoVideoId, orderIndex } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newContentItem = await db
      .insert(toolkitContentItems)
      .values({
        toolkitId,
        title,
        type,
        content,
        vimeoVideoId,
        orderIndex: orderIndex || 0,
      })
      .returning();

    return NextResponse.json(newContentItem[0], { status: 201 });
  } catch (error) {
    console.error("Error creating toolkit content item:", error);
    return NextResponse.json(
      { error: "Failed to create toolkit content item" },
      { status: 500 }
    );
  }
}
