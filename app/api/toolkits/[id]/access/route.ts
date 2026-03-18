import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getSessionCached } from "@/lib/auth-session-cache";
import { db } from "@/lib/db";
import { toolkits, userToolkitProgress, userToolkits } from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: toolkitId } = await params;

    const toolkitExists = await db
      .select({ id: toolkits.id })
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!toolkitExists || toolkitExists.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    const session = await getSessionCached(await headers());

    if (!session?.user?.id) {
      return NextResponse.json({ hasPurchased: false, completedItemIds: [] });
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
      return NextResponse.json({ hasPurchased: false, completedItemIds: [] });
    }

    const completedProgress = await db
      .select({ contentItemId: userToolkitProgress.contentItemId })
      .from(userToolkitProgress)
      .where(
        and(
          eq(userToolkitProgress.userId, session.user.id),
          eq(userToolkitProgress.toolkitId, toolkitId)
        )
      );

    return NextResponse.json({
      hasPurchased: true,
      completedItemIds: completedProgress.map((item) => item.contentItemId),
    });
  } catch (error) {
    console.error("Error fetching toolkit access:", error);
    return NextResponse.json(
      { error: "Failed to fetch toolkit access" },
      { status: 500 }
    );
  }
}
