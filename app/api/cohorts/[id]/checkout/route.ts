import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { cohorts, cohortTiers, cohortOrders, cohortAddOns, coupons, userToolkits, toolkits, cohortSessions, user } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createOrder } from "@/lib/razorpay";
import { sendCohortPaymentConfirmationEmail } from "@/lib/cohort-payment-email";
export function getDuoPricing(singlePrice: number) {
  if (!singlePrice || singlePrice <= 0) {
    return { reference: 0, final: 0, perHead: 0 };
  }
  const raw_duo = singlePrice * 2;
  const reference = Math.ceil((raw_duo + 1) / 100) * 100 - 1;
  const final = Math.round((reference * 0.8) / 10) * 10 - 1;
  const perHead = Math.round(final / 2);
  return { reference, final, perHead };
}

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
    const {
      selectedTierId,
      selectedAddOnIds = [],
      selectedToolkitIds = [],
      buyerName,
      buyerEmail,
      buyerPhone,
      buddyEmail,
      couponCode,
    } = body;

    if (!buyerName || !buyerEmail) {
      return NextResponse.json(
        { error: "Buyer name and email are required" },
        { status: 400 }
      );
    }

    if (!selectedTierId && selectedAddOnIds.length === 0) {
      return NextResponse.json(
        { error: "Please select either the bundle tier or at least one individual session to apply." },
        { status: 400 }
      );
    }

    if (selectedTierId && selectedAddOnIds.length > 0) {
      return NextResponse.json(
        { error: "Cannot select both a bundle tier and individual sessions simultaneously" },
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

    // 2. Fetch Tier if selected
    let tierPrice = 0;
    if (selectedTierId) {
      const tier = await db.query.cohortTiers.findFirst({
        where: and(
          eq(cohortTiers.id, selectedTierId),
          eq(cohortTiers.cohortId, cohortId)
        ),
      });

      if (!tier) {
        return NextResponse.json({ error: "Selected tier not found" }, { status: 400 });
      }
      tierPrice = tier.price;
    }

    // 3. Fetch Add-ons (sessions)
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
        addonsTotal += addon.priceDelta || 0;
      });
    }

    // Fetch Toolkit Add-ons
    let toolkitsTotal = 0;
    if (selectedToolkitIds.length > 0) {
      const dbToolkits = await db
        .select()
        .from(toolkits)
        .where(
          and(
            eq(toolkits.isActive, true),
            inArray(toolkits.id, selectedToolkitIds)
          )
        );
      
      dbToolkits.forEach((tk) => {
        toolkitsTotal += tk.price;
      });
    }

    const isDuoActive = buddyEmail && buddyEmail.trim().length > 0;
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
          const subtotalForDiscount = (isDuoActive ? getDuoPricing(tierPrice).final : tierPrice) + 
                                      (isDuoActive ? getDuoPricing(addonsTotal).final : addonsTotal) + 
                                      toolkitsTotal;
          if (coupon.discountType === "percentage") {
            discountAmount = Math.round((subtotalForDiscount * coupon.discountAmount) / 100);
          } else {
            discountAmount = coupon.discountAmount;
          }
          couponId = coupon.id;
        }
      }
    }

    // 5. Compute Total price (in rupees)
    const finalTierPrice = isDuoActive ? getDuoPricing(tierPrice).final : tierPrice;
    const finalAddonsTotal = isDuoActive ? getDuoPricing(addonsTotal).final : addonsTotal;

    const subtotal = finalTierPrice + finalAddonsTotal + toolkitsTotal;
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
          buddyEmail: buddyEmail ? buddyEmail.trim().toLowerCase() : null,
          selectedTierId: selectedTierId || null,
          selectedAddOnIds,
          selectedToolkitIds,
          amountPaid: 0,
          razorpayOrderId: "free_cohort_" + crypto.randomUUID(),
          couponId,
          status: "paid",
        })
        .returning();

      // If buddy email is added, grant them access to the cohort's linked toolkit if their account already exists
      if (buddyEmail && cohort.toolkitId) {
        try {
          const buddyUser = await db.query.user.findFirst({
            where: eq(user.email, buddyEmail.trim().toLowerCase()),
          });
          if (buddyUser) {
            const existingBuddyToolkit = await db.query.userToolkits.findFirst({
              where: and(
                eq(userToolkits.userId, buddyUser.id),
                eq(userToolkits.toolkitId, cohort.toolkitId)
              ),
            });
            if (!existingBuddyToolkit) {
              await db.insert(userToolkits).values({
                userId: buddyUser.id,
                toolkitId: cohort.toolkitId,
                paymentStatus: "completed",
                amountPaid: 0,
              });
            }
          }
        } catch (e) {
          console.error("Error granting free cohort access to buddy user:", e);
        }
      }

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

      // Also grant access to any selected toolkit add-ons!
      for (const tkId of selectedToolkitIds) {
        const existingUserToolkit = await db.query.userToolkits.findFirst({
          where: and(
            eq(userToolkits.userId, userId),
            eq(userToolkits.toolkitId, tkId)
          ),
        });
        
        if (!existingUserToolkit) {
          await db.insert(userToolkits).values({
            userId,
            toolkitId: tkId,
            paymentStatus: "completed",
            amountPaid: 0,
          });
        }
      }

      sendCohortPaymentConfirmationEmail(newOrder.id).catch((emailError) => {
        console.error("Cohort payment confirmation email failed:", emailError);
      });
      // Increment coupon usage if a coupon was applied
      if (couponId) {
        await db
          .update(coupons)
          .set({ currentUses: sql`${coupons.currentUses} + 1` })
          .where(eq(coupons.id, couponId));
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
        buddyEmail: buddyEmail ? buddyEmail.trim().toLowerCase() : null,
        selectedTierId: selectedTierId || null,
        selectedAddOnIds,
        selectedToolkitIds,
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
