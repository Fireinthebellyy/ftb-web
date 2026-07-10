import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortOrders, cohorts, cohortTiers } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await db
      .select({
        id: cohortOrders.id,
        buyerName: cohortOrders.buyerName,
        buyerEmail: cohortOrders.buyerEmail,
        buyerPhone: cohortOrders.buyerPhone,
        amountPaid: cohortOrders.amountPaid,
        razorpayOrderId: cohortOrders.razorpayOrderId,
        razorpayPaymentId: cohortOrders.razorpayPaymentId,
        status: cohortOrders.status,
        createdAt: cohortOrders.createdAt,
        cohortTitle: cohorts.title,
        tierName: cohortTiers.name,
      })
      .from(cohortOrders)
      .leftJoin(cohorts, eq(cohortOrders.cohortId, cohorts.id))
      .leftJoin(cohortTiers, eq(cohortOrders.selectedTierId, cohortTiers.id))
      .orderBy(desc(cohortOrders.createdAt));

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching admin cohort orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
