import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits, userToolkits } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, and, inArray } from "drizzle-orm";

// GET user's purchased toolkits
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || !user.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all toolkits that the user has purchased
    const purchasedToolkits = await db
      .select()
      .from(userToolkits)
      .where(
        and(
          eq(userToolkits.userId, user.currentUser.id),
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
