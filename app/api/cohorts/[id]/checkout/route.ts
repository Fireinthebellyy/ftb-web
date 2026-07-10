import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohorts, cohortTiers, cohortAddOns, cohortOrders, coupons, userToolkits } from "@/lib/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createOrder } from "@/lib/razorpay";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const cohortId = paramsResolved.id;

    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { selectedTierId, selectedAddOnIds = [], buyerName, buyerEmail, buyerPhone, couponCode } = body;

    if (!selectedTierId || !buyerName || !buyerEmail) {
      return NextResponse.json(
        { error: "Tier ID, buyer name, and buyer email are required" },
        { status: 400 }
      );
    }

    // 1. Verify Cohort
    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, cohortId),
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    // 2. Fetch Tier
    const tier = await db.query.cohortTiers.findFirst({
      where: and(
        eq(cohortTiers.id, selectedTierId),
        eq(cohortTiers.cohortId, cohortId)
      ),
    });

    if (!tier) {
      return NextResponse.json({ error: "Selected tier not found" }, { status: 400 });
    }

    // 3. Fetch Add-ons
    let addonsTotal = 0;
    if (selectedAddOnIds.length > 0) {
      const addons = await db
        .select()
        .from(cohortAddOns)
        .where(
          and(
            eq(cohortAddOns.cohortId, cohortId),
            inArray(cohortAddOns.id, selectedAddOnIds)
          )
        );
      
      addons.forEach((addon) => {
        addonsTotal += addon.priceDelta;
      });
    }

    // 4. Validate Coupon if provided
    let discountAmount = 0;
    let couponId: string | null = null;
    
    if (couponCode) {
      const couponResult = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, couponCode.toUpperCase().trim()))
        .limit(1);

      if (couponResult && couponResult.length > 0) {
        const coupon = couponResult[0];
        
        let isValid = coupon.isActive;
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          isValid = false;
        }
        if (typeof coupon.maxUses === "number" && coupon.currentUses >= coupon.maxUses) {
          isValid = false;
        }
        
        if (isValid) {
          const userCouponUses = await db
            .select({ count: sql<number>`count(*)` })
            .from(cohortOrders)
            .where(
              and(
                eq(cohortOrders.userId, userId),
                eq(cohortOrders.couponId, coupon.id),
                eq(cohortOrders.status, "paid")
              )
            );
          const usesCount = Number(userCouponUses[0]?.count || 0);
          const maxPerUser = coupon.maxUsesPerUser == null ? Infinity : Number(coupon.maxUsesPerUser);
          if (usesCount >= maxPerUser) {
            isValid = false;
          }
        }
        
        if (isValid) {
          discountAmount = coupon.discountAmount;
          couponId = coupon.id;
        }
      }
    }

    // 5. Compute Total price (in rupees)
    const subtotal = tier.price + addonsTotal;
    const finalPriceRupees = Math.max(0, subtotal - discountAmount);
    const finalPricePaisa = finalPriceRupees * 100; // Razorpay needs amount in paisa

    // 6. Direct free cohort access if price is 0
    if (finalPriceRupees <= 0) {
      const [newOrder] = await db
        .insert(cohortOrders)
        .values({
          cohortId,
          userId,
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone || null,
          selectedTierId,
          selectedAddOnIds,
          amountPaid: 0,
          razorpayOrderId: "free_cohort_" + Date.now().toString().slice(-6),
          couponId,
          status: "paid",
        })
        .returning();

      // If cohort is linked to a toolkit, grant content access
      if (cohort.toolkitId) {
        const existingUserToolkit = await db.query.userToolkits.findFirst({
          where: and(
            eq(userToolkits.userId, userId),
            eq(userToolkits.toolkitId, cohort.toolkitId)
          ),
        });
        
        if (!existingUserToolkit) {
          await db.insert(userToolkits).values({
            userId,
            toolkitId: cohort.toolkitId,
            paymentStatus: "completed",
            amountPaid: 0,
          });
        }
      }

      return NextResponse.json({
        success: true,
        free: true,
        orderRecord: newOrder,
      });
    }

    // 7. Create Razorpay Order
    const receiptId = `ch_${cohortId.slice(-6)}_${Date.now().toString().slice(-6)}`;
    const order = await createOrder({
      amount: finalPricePaisa,
      currency: "INR",
      receipt: receiptId,
    });

    // 8. Insert Order Record in DB
    const [newOrder] = await db
      .insert(cohortOrders)
      .values({
        cohortId,
        userId,
        buyerName,
        buyerEmail,
        buyerPhone: buyerPhone || null,
        selectedTierId,
        selectedAddOnIds,
        amountPaid: Number(order.amount), // in paise
        razorpayOrderId: order.id,
        couponId,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      free: false,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      orderRecord: newOrder,
    });
  } catch (error) {
    console.error("Error creating cohort checkout order:", error);
    return NextResponse.json(
      { error: "Failed to create checkout order" },
      { status: 500 }
    );
  }
}
