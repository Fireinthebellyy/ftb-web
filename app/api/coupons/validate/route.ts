import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons, toolkits, userToolkits, cohorts, cohortOrders } from "@/lib/schema";
import { getCurrentUserOptional } from "@/server/users";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { code, toolkitId, cohortId } = await request.json();

    if (!code || (!toolkitId && !cohortId)) {
      return NextResponse.json(
        { error: "Code and either toolkitId or cohortId are required" },
        { status: 400 }
      );
    }

    if (toolkitId && cohortId) {
      return NextResponse.json(
        { error: "Provide either toolkitId or cohortId, not both" },
        { status: 400 }
      );
    }

    let basePrice = 0;

    if (toolkitId) {
      // Fetch toolkit to get base price
      const toolkitResult = await db
        .select({ price: toolkits.price })
        .from(toolkits)
        .where(eq(toolkits.id, toolkitId))
        .limit(1);

      if (!toolkitResult || toolkitResult.length === 0) {
        return NextResponse.json(
          { error: "Toolkit not found" },
          { status: 404 }
        );
      }
      basePrice = toolkitResult[0].price;
    } else if (cohortId) {
      // Fetch cohort to get base price
      const cohortResult = await db
        .select({ price: cohorts.basePrice })
        .from(cohorts)
        .where(eq(cohorts.id, cohortId))
        .limit(1);

      if (!cohortResult || cohortResult.length === 0) {
        return NextResponse.json(
          { error: "Cohort not found" },
          { status: 404 }
        );
      }
      basePrice = cohortResult[0].price;
    }

    // Find coupon by code
    const couponResult = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase().trim()))
      .limit(1);

    if (!couponResult || couponResult.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Invalid coupon code" },
        { status: 200 }
      );
    }

    const coupon = couponResult[0];

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: "Coupon is not active" },
        { status: 200 }
      );
    }

    // Check if coupon is cohort-only and being used for toolkit
    if (toolkitId && coupon.cohortOnly === true) {
      return NextResponse.json(
        { valid: false, error: "This coupon is only valid for cohort purchases" },
        { status: 200 }
      );
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Coupon has expired" },
        { status: 200 }
      );
    }

    // Check total usage limit
    if (
      typeof coupon.maxUses === "number" &&
      coupon.currentUses >= coupon.maxUses
    ) {
      return NextResponse.json(
        { valid: false, error: "Coupon usage limit reached" },
        { status: 200 }
      );
    }

    // Check per-user limit
    const userSession = await getCurrentUserOptional();
    if (userSession && userSession.currentUser?.id) {
      let usesCount = 0;
      if (toolkitId) {
        const userCouponUses = await db
          .select({ count: sql<number>`count(*)` })
          .from(userToolkits)
          .where(
            and(
              eq(userToolkits.userId, userSession.currentUser.id),
              eq(userToolkits.couponId, coupon.id),
              eq(userToolkits.paymentStatus, "completed")
            )
          );
        usesCount = Number(userCouponUses[0]?.count || 0);
      } else if (cohortId) {
        const userCouponUses = await db
          .select({ count: sql<number>`count(*)` })
          .from(cohortOrders)
          .where(
            and(
              eq(cohortOrders.userId, userSession.currentUser.id),
              eq(cohortOrders.couponId, coupon.id),
              eq(cohortOrders.status, "paid")
            )
          );
        usesCount = Number(userCouponUses[0]?.count || 0);
      }

      const maxPerUser =
        coupon.maxUsesPerUser == null
          ? Infinity
          : Number(coupon.maxUsesPerUser);
      if (usesCount >= maxPerUser) {
        return NextResponse.json(
          { valid: false, error: "You have already used this coupon" },
          { status: 200 }
        );
      }
    }

    // Calculate final price
    const discountAmount = coupon.discountAmount;
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return NextResponse.json({
      valid: true,
      discountAmount,
      finalPrice,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountAmount: coupon.discountAmount,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
