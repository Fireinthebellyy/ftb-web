import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons, userToolkits } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { code, toolkitId } = await request.json();

    if (!code || !toolkitId) {
      return NextResponse.json(
        { error: "Code and toolkitId are required" },
        { status: 400 }
      );
    }

    // Fetch toolkit to get base price
    const { toolkits } = await import("@/lib/schema");
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

    const toolkit = toolkitResult[0];

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

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Coupon has expired" },
        { status: 200 }
      );
    }

    // Check total usage limit
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, error: "Coupon usage limit reached" },
        { status: 200 }
      );
    }

    // Check per-user limit
    const userSession = await getCurrentUser();
    if (userSession && userSession.currentUser?.id) {
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

      const usesCount = Number(userCouponUses[0]?.count || 0);
      if (usesCount >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          { valid: false, error: "You have already used this coupon" },
          { status: 200 }
        );
      }
    }

    // Calculate final price
    const discountAmount = coupon.discountAmount;
    const finalPrice = Math.max(0, toolkit.price - discountAmount);

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
