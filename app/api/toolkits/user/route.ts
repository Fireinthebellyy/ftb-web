import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits, userToolkits } from "@/lib/schema";
import { getSessionCached } from "@/lib/auth-session-cache";
import { eq, and, inArray } from "drizzle-orm";
import { headers } from "next/headers";

// GET user's purchased toolkits
export async function GET() {
  try {
    const session = await getSessionCached(await headers());

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all toolkits that the user has purchased
    const purchasedToolkits = await db
      .select()
      .from(userToolkits)
      .where(
        and(
          eq(userToolkits.userId, session.user.id),
          eq(userToolkits.paymentStatus, "completed")
        )
      );

    if (purchasedToolkits.length === 0) {
      return NextResponse.json({
        success: true,
        toolkits: [],
      });
    }

    // Extract toolkit IDs
    const toolkitIds = purchasedToolkits.map((purchase) => purchase.toolkitId);

    // Get full toolkit details
    const toolkitsData = await db
      .select()
      .from(toolkits)
      .where(inArray(toolkits.id, toolkitIds));

    return NextResponse.json({
      success: true,
      toolkits: toolkitsData,
    });
  } catch (error) {
    console.error("Error fetching user toolkits:", error);
    return NextResponse.json(
      { error: "Failed to fetch user toolkits" },
      { status: 500 }
    );
  }
}
