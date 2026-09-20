import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { sprints, sprintTiers, sprintOrders, coupons, userToolkits, toolkits, sprintSessions, siteSettings, sprintUpgradePlans } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createOrder } from "@/lib/razorpay";
import { getPaidSprintOrderForUser } from "@/lib/sprint-registration";
import { sendSprintPaymentConfirmationEmail } from "@/lib/sprint-payment-email";

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
    const sprintId = paramsResolved.id;

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
      selectedAddOnIds: rawAddOns = [],
      selectedToolkitIds = [],
      selectedUpgradePlanId,
      buyerName,
      buyerEmail,
      buyerPhone,
      couponCode,
      validateCouponOnly = false,
    } = body;
    
    let selectedAddOnIds = [...rawAddOns];
    let { buddyEmail } = body;

    const effectiveBuyerName = buyerName?.trim() || session.user.name || "Learner";
    const effectiveBuyerEmail = buyerEmail?.trim() || session.user.email;

    if (!effectiveBuyerName || !effectiveBuyerEmail) {
      return NextResponse.json(
        { error: "Buyer name and email are required" },
        { status: 400 }
      );
    }

    const settings = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.id, "global")
    });

    if (!settings?.isBuddyOfferEnabled) {
      buddyEmail = null;
    }

    let upgradePlanPrice = 0;
    let _isUpgradePlanAllInOne = false;
    let _upgradePlanIncludedSessionCount: number | null = null;
    let upgradePlanIncludedSessionIds: string[] = [];

    if (selectedUpgradePlanId) {
      const upgradePlan = await db.query.sprintUpgradePlans.findFirst({
        where: and(
          eq(sprintUpgradePlans.id, selectedUpgradePlanId),
          eq(sprintUpgradePlans.sprintId, sprintId),
          eq(sprintUpgradePlans.isActive, true)
        ),
      });

      if (!upgradePlan) {
        return NextResponse.json(
          { error: "Selected upgrade package is not available or invalid" },
          { status: 400 }
        );
      }

      upgradePlanPrice = upgradePlan.price;
      _isUpgradePlanAllInOne = Boolean(upgradePlan.isAllInOne);
      _upgradePlanIncludedSessionCount = upgradePlan.includedSessionCount;

      if (upgradePlan.includedSessionIds && upgradePlan.includedSessionIds.length > 0) {
        upgradePlanIncludedSessionIds = upgradePlan.includedSessionIds;
        const merged = new Set([...selectedAddOnIds, ...upgradePlan.includedSessionIds]);
        selectedAddOnIds = Array.from(merged);
      }
    }

    const sprint = await db.query.sprints.findFirst({
      where: eq(sprints.id, sprintId),
    });

    if (!sprint || !sprint.isActive) {
      return NextResponse.json(
        { error: "Sprint not found or is inactive" },
        { status: 404 }
      );
    }

    const existingOrder = await getPaidSprintOrderForUser(userId, sprintId);
    let _isAlreadyEnrolled = false;

    if (existingOrder) {
      _isAlreadyEnrolled = true;
      if (selectedTierId) {
        return NextResponse.json(
          { error: "You are already enrolled in this sprint base program." },
          { status: 400 }
        );
      }
    }

    let baseAmount = 0;

    if (selectedTierId) {
      const tier = await db.query.sprintTiers.findFirst({
        where: and(
          eq(sprintTiers.id, selectedTierId),
          eq(sprintTiers.sprintId, sprintId)
        ),
      });

      if (!tier) {
        return NextResponse.json(
          { error: "Invalid tier selected" },
          { status: 400 }
        );
      }
      baseAmount = tier.price;
    } else if (selectedUpgradePlanId) {
      baseAmount = upgradePlanPrice;
    } else {
      baseAmount = sprint.basePrice;
    }

    if (buddyEmail && selectedTierId) {
      const duoInfo = getDuoPricing(baseAmount);
      baseAmount = duoInfo.final;
    }

    let addOnTotal = 0;
    if (selectedAddOnIds.length > 0) {
      const sessionRecords = await db
        .select({ id: sprintSessions.id, price: sprintSessions.price })
        .from(sprintSessions)
        .where(
          and(
            inArray(sprintSessions.id, selectedAddOnIds),
            eq(sprintSessions.sprintId, sprintId)
          )
        );

      sessionRecords.forEach((rec) => {
        if (rec.price && rec.price > 0) {
          addOnTotal += rec.price;
        }
      });
    }

    let toolkitsTotal = 0;
    if (selectedToolkitIds.length > 0) {
      const toolkitRecords = await db
        .select({ id: toolkits.id, price: toolkits.price })
        .from(toolkits)
        .where(inArray(toolkits.id, selectedToolkitIds));

      toolkitRecords.forEach((tk) => {
        if (tk.price && tk.price > 0) {
          toolkitsTotal += tk.price;
        }
      });
    }

    let subtotal = baseAmount + addOnTotal + toolkitsTotal;
    let discountAmount = 0;
    let appliedCoupon: any = null;

    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await db.query.coupons.findFirst({
        where: and(eq(coupons.code, cleanCode), eq(coupons.isActive, true)),
      });

      if (!coupon) {
        return NextResponse.json(
          { error: "Invalid or expired coupon code" },
          { status: 400 }
        );
      }

      const now = new Date();
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        return NextResponse.json(
          { error: "Coupon has expired" },
          { status: 400 }
        );
      }

      if (coupon.maxUses && (coupon.currentUses ?? 0) >= coupon.maxUses) {
        return NextResponse.json(
          { error: "Coupon usage limit reached" },
          { status: 400 }
        );
      }

      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((subtotal * coupon.discountAmount) / 100);
      } else {
        discountAmount = coupon.discountAmount;
      }

      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }

      appliedCoupon = coupon;
    }

    const finalAmount = Math.max(0, subtotal - discountAmount);

    if (validateCouponOnly) {
      return NextResponse.json({
        valid: true,
        coupon: {
          code: appliedCoupon?.code,
          discountType: appliedCoupon?.discountType,
          discountAmount: appliedCoupon?.discountAmount,
        },
        subtotal,
        discountAmount,
        finalAmount,
      });
    }

    if (finalAmount === 0) {
      const dummyOrderId = `free_sprint_order_${Date.now()}`;
      const newOrder = await db
        .insert(sprintOrders)
        .values({
          sprintId,
          userId,
          buyerName: effectiveBuyerName,
          buyerEmail: effectiveBuyerEmail.toLowerCase(),
          buyerPhone: buyerPhone || null,
          buddyEmail: buddyEmail ? buddyEmail.trim().toLowerCase() : null,
          selectedTierId: selectedTierId || null,
          selectedUpgradePlanId: selectedUpgradePlanId || null,
          selectedAddOnIds,
          selectedToolkitIds,
          selectedSessionIds: upgradePlanIncludedSessionIds,
          amountPaid: 0,
          couponId: appliedCoupon ? appliedCoupon.id : null,
          razorpayOrderId: dummyOrderId,
          razorpayPaymentId: `free_payment_${Date.now()}`,
          status: "paid",
          isVerified: true,
        })
        .returning();

      if (selectedToolkitIds.length > 0) {
        for (const tkId of selectedToolkitIds) {
          await db
            .insert(userToolkits)
            .values({
              userId,
              toolkitId: tkId,
            })
            .onConflictDoNothing();
        }
      }

      void sendSprintPaymentConfirmationEmail(newOrder[0].id).catch(err => {
        console.error("Failed to send zero-amount sprint email async:", err);
      });

      return NextResponse.json({
        orderId: dummyOrderId,
        amount: 0,
        currency: "INR",
        freeOrder: true,
        sprintOrderId: newOrder[0].id,
      });
    }

    const razorpayOrder = await createOrder({
      amount: finalAmount,
      currency: "INR",
      receipt: `receipt_sprint_${Date.now()}`,
    });

    const newOrder = await db
      .insert(sprintOrders)
      .values({
        sprintId,
        userId,
        buyerName: effectiveBuyerName,
        buyerEmail: effectiveBuyerEmail.toLowerCase(),
        buyerPhone: buyerPhone || null,
        buddyEmail: buddyEmail ? buddyEmail.trim().toLowerCase() : null,
        selectedTierId: selectedTierId || null,
        selectedUpgradePlanId: selectedUpgradePlanId || null,
        selectedAddOnIds,
        selectedToolkitIds,
        selectedSessionIds: upgradePlanIncludedSessionIds,
        amountPaid: finalAmount * 100,
        couponId: appliedCoupon ? appliedCoupon.id : null,
        razorpayOrderId: razorpayOrder.id,
        status: "created",
        isVerified: false,
      })
      .returning();

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      sprintOrderId: newOrder[0].id,
    });
  } catch (error) {
    console.error("Error creating sprint checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout order" },
      { status: 500 }
    );
  }
}
