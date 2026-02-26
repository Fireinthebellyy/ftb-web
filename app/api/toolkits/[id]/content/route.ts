import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { toolkitContentItems, toolkits } from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: toolkitId } = await params;

    const toolkitResult = await db
      .select({
        id: toolkits.id,
        title: toolkits.title,
      })
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!toolkitResult || toolkitResult.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    const contentItems = await db
      .select({
        id: toolkitContentItems.id,
        toolkitId: toolkitContentItems.toolkitId,
        title: toolkitContentItems.title,
        type: toolkitContentItems.type,
        content: toolkitContentItems.content,
        bunnyVideoUrl: toolkitContentItems.bunnyVideoUrl,
        orderIndex: toolkitContentItems.orderIndex,
        createdAt: toolkitContentItems.createdAt,
        updatedAt: toolkitContentItems.updatedAt,
      })
      .from(toolkitContentItems)
      .where(eq(toolkitContentItems.toolkitId, toolkitId))
      .orderBy(asc(toolkitContentItems.orderIndex));

    return NextResponse.json({
      toolkit: toolkitResult[0],
      contentItems,
    });
  } catch (error) {
    console.error("Error fetching toolkit content:", error);
    return NextResponse.json(
      { error: "Failed to fetch toolkit content" },
      { status: 500 }
    );
  }
}
