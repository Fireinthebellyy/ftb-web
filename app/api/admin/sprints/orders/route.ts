import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintOrders, sprints, sprintTiers, coupons, sprintUpgradePlans } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await db
      .select({
        id: sprintOrders.id,
        userId: sprintOrders.userId,
        buyerName: sprintOrders.buyerName,
        buyerEmail: sprintOrders.buyerEmail,
        buyerPhone: sprintOrders.buyerPhone,
        buddyEmail: sprintOrders.buddyEmail,
        amountPaid: sprintOrders.amountPaid,
        razorpayOrderId: sprintOrders.razorpayOrderId,
        razorpayPaymentId: sprintOrders.razorpayPaymentId,
        status: sprintOrders.status,
        createdAt: sprintOrders.createdAt,
        sprintTitle: sprints.title,
        sprintId: sprintOrders.sprintId,
        tierName: sprintTiers.name,
        selectedUpgradePlanId: sprintOrders.selectedUpgradePlanId,
        upgradePlanTitle: sprintUpgradePlans.title,
        upgradePlanPrice: sprintUpgradePlans.price,
        upgradePlanSectionLabel: sprintUpgradePlans.sectionLabel,
        upgradePlanIsAllInOne: sprintUpgradePlans.isAllInOne,
        isVerified: sprintOrders.isVerified,
        registrationName: sprintOrders.registrationName,
        registrationCollege: sprintOrders.registrationCollege,
        registrationCourse: sprintOrders.registrationCourse,
        registrationYear: sprintOrders.registrationYear,
        registrationExpectations: sprintOrders.registrationExpectations,
        registrationCompletedAt: sprintOrders.registrationCompletedAt,
        selectedSessionIds: sprintOrders.selectedSessionIds,
        selectedAddOnIds: sprintOrders.selectedAddOnIds,
        couponId: sprintOrders.couponId,
        couponCode: coupons.code,
      })
      .from(sprintOrders)
      .leftJoin(sprints, eq(sprintOrders.sprintId, sprints.id))
      .leftJoin(sprintTiers, eq(sprintOrders.selectedTierId, sprintTiers.id))
      .leftJoin(sprintUpgradePlans, eq(sprintOrders.selectedUpgradePlanId, sprintUpgradePlans.id))
      .leftJoin(coupons, eq(sprintOrders.couponId, coupons.id))
      .orderBy(desc(sprintOrders.createdAt));

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching admin sprint orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
