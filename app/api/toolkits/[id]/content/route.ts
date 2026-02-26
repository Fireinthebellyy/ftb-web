import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getSessionCached } from "@/lib/auth-session-cache";
import { db } from "@/lib/db";
import { toolkitContentItems, toolkits, userToolkits } from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: toolkitId } = await params;

    const session = await getSessionCached(await headers());

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchase = await db
      .select({ id: userToolkits.id })
      .from(userToolkits)
      .where(
        and(
          eq(userToolkits.userId, session.user.id),
          eq(userToolkits.toolkitId, toolkitId),
          eq(userToolkits.paymentStatus, "completed")
        )
      )
      .limit(1);

    if (purchase.length === 0) {
      return NextResponse.json(
        { error: "You do not have access to this toolkit" },
        { status: 403 }
      );
    }

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
