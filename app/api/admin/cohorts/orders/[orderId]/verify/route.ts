import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortOrders } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await db.query.cohortOrders.findFirst({
      where: eq(cohortOrders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await db
      .update(cohortOrders)
      .set({ isVerified: !order.isVerified })
      .where(eq(cohortOrders.id, orderId));

    return NextResponse.json({ success: true, isVerified: !order.isVerified });
  } catch (error) {
    console.error("Error verifying cohort order:", error);
    return NextResponse.json(
      { error: "Failed to verify order" },
      { status: 500 }
    );
  }
}
