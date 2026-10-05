import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  sprints,
  sprintTiers,
  sprintOrders,
  coupons,
  userToolkits,
  toolkits,
  sprintSessions,
  siteSettings,
  sprintUpgradePlans,
  user,
} from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createOrder } from "@/lib/razorpay";
import { sendSprintPaymentConfirmationEmail } from "@/lib/sprint-payment-email";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveSprint(identifier: string) {
  if (UUID_REGEX.test(identifier)) {
    return db.query.sprints.findFirst({
      where: eq(sprints.id, identifier),
    });
  }

  return db.query.sprints.findFirst({
    where: eq(sprints.slug, identifier),
  });
}

function getDuoPricing(singlePrice: number) {
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
    const identifier = paramsResolved.id;

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

    const effectiveBuyerName =
      buyerName?.trim() || session.user.name || "Learner";
    const effectiveBuyerEmail = buyerEmail?.trim() || session.user.email;

    if (!effectiveBuyerName || !effectiveBuyerEmail) {
      return NextResponse.json(
        { error: "Buyer name and email are required" },
        { status: 400 }
      );
    }

    const sprint = await resolveSprint(identifier);
    if (!sprint || !sprint.isActive) {
      return NextResponse.json(
        { error: "Sprint not found or is inactive" },
        { status: 404 }
      );
    }
    const sprintId = sprint.id;

    const settings = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.id, "global"),
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

      if (
        upgradePlan.includedSessionIds &&
        upgradePlan.includedSessionIds.length > 0
      ) {
        upgradePlanIncludedSessionIds = upgradePlan.includedSessionIds;
        const merged = new Set([
          ...selectedAddOnIds,
          ...upgradePlan.includedSessionIds,
        ]);
        selectedAddOnIds = Array.from(merged);
      }
    }

    // Check existing paid orders to verify eligibility & preserve registration details
    const existingPaidOrders = await db.query.sprintOrders.findMany({
      where: and(
        eq(sprintOrders.sprintId, sprintId),
        eq(sprintOrders.userId, userId),
        eq(sprintOrders.status, "paid")
      ),
      orderBy: (sprintOrders, { desc }) => [desc(sprintOrders.createdAt)],
    });

    const hasPurchasedTier = existingPaidOrders.some((o) =>
      Boolean(o.selectedTierId)
    );
    const previousCompletedOrder = existingPaidOrders.find((o) =>
      Boolean(o.registrationCompletedAt)
    );

    // Only block tier purchase if they ALREADY enrolled in a full base tier
    if (selectedTierId && hasPurchasedTier) {
      return NextResponse.json(
        { error: "You are already enrolled in this sprint base program." },
        { status: 400 }
      );
    }

    const registrationCompletedAtFromPrevious =
      previousCompletedOrder?.registrationCompletedAt ?? null;
    const registrationNameFromPrevious =
      previousCompletedOrder?.registrationName ?? null;
    const registrationCollegeFromPrevious =
      previousCompletedOrder?.registrationCollege ?? null;
    const registrationCourseFromPrevious =
      previousCompletedOrder?.registrationCourse ?? null;
    const registrationMobileNumberFromPrevious =
      previousCompletedOrder?.registrationMobileNumber ?? null;
    const registrationYearFromPrevious =
      previousCompletedOrder?.registrationYear ?? null;
    const registrationCityFromPrevious =
      previousCompletedOrder?.registrationCity ?? null;
    const registrationExpectationsFromPrevious =
      previousCompletedOrder?.registrationExpectations ?? null;
    const registrationConsentFromPrevious =
      previousCompletedOrder?.registrationConsent ?? null;
    const isVerifiedFromPrevious = previousCompletedOrder?.isVerified ?? false;

    // Pricing calculation
    let baseAmount = 0;
    let addOnTotal = 0;

    if (selectedUpgradePlanId) {
      // UPGRADE PLAN: Price is solely the upgrade package price.
      baseAmount = upgradePlanPrice;
    } else if (selectedTierId) {
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
    } else if (selectedAddOnIds.length > 0) {
      // SESSIONS ONLY: base amount is 0, user pays for chosen sessions
      baseAmount = 0;
    } else if (selectedToolkitIds.length > 0) {
      // TOOLKITS ONLY: base amount is 0
      baseAmount = 0;
    } else {
      if (!validateCouponOnly) {
        return NextResponse.json(
          {
            error:
              "Please select a bundle tier, upgrade package, or at least one session.",
          },
          { status: 400 }
        );
      }
      baseAmount = sprint.basePrice;
    }

    if (buddyEmail && selectedTierId) {
      const duoInfo = getDuoPricing(baseAmount);
      baseAmount = duoInfo.final;
    }

    // Only compute addOnTotal if NOT purchasing an upgrade plan (prevent double charging)
    if (selectedAddOnIds.length > 0 && !selectedUpgradePlanId) {
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

      if (buddyEmail && !selectedTierId) {
        const duoInfo = getDuoPricing(addOnTotal);
        addOnTotal = duoInfo.final;
      }
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
          isVerified: isVerifiedFromPrevious,
          registrationCompletedAt: registrationCompletedAtFromPrevious,
          registrationName: registrationNameFromPrevious,
          registrationCollege: registrationCollegeFromPrevious,
          registrationCourse: registrationCourseFromPrevious,
          registrationMobileNumber: registrationMobileNumberFromPrevious,
          registrationYear: registrationYearFromPrevious,
          registrationCity: registrationCityFromPrevious,
          registrationExpectations: registrationExpectationsFromPrevious,
          registrationConsent: registrationConsentFromPrevious,
        })
        .returning();

      // Increment coupon uses if coupon was applied
      if (appliedCoupon) {
        await db
          .update(coupons)
          .set({ currentUses: sql`${coupons.currentUses} + 1` })
          .where(eq(coupons.id, appliedCoupon.id));
      }

      // Grant linked toolkit access to user if sprint has toolkitId
      if (sprint.toolkitId) {
        await db
          .insert(userToolkits)
          .values({
            userId,
            toolkitId: sprint.toolkitId,
            paymentStatus: "completed",
            amountPaid: 0,
          })
          .onConflictDoNothing();
      }

      if (selectedToolkitIds.length > 0) {
        for (const tkId of selectedToolkitIds) {
          await db
            .insert(userToolkits)
            .values({
              userId,
              toolkitId: tkId,
              paymentStatus: "completed",
              amountPaid: 0,
            })
            .onConflictDoNothing();
        }
      }

      // Grant buddy access for free orders
      if (buddyEmail) {
        try {
          const buddyUser = await db.query.user.findFirst({
            where: eq(user.email, buddyEmail.trim().toLowerCase()),
          });

          if (buddyUser) {
            if (sprint.toolkitId) {
              await db
                .insert(userToolkits)
                .values({
                  userId: buddyUser.id,
                  toolkitId: sprint.toolkitId,
                  paymentStatus: "completed",
                  amountPaid: 0,
                })
                .onConflictDoNothing();
            }

            const existingBuddyOrder = await db.query.sprintOrders.findFirst({
              where: and(
                eq(sprintOrders.userId, buddyUser.id),
                eq(sprintOrders.sprintId, sprintId),
                eq(sprintOrders.status, "paid")
              ),
            });

            if (!existingBuddyOrder) {
              await db.insert(sprintOrders).values({
                sprintId,
                userId: buddyUser.id,
                buyerName: effectiveBuyerName,
                buyerEmail: buddyEmail.trim().toLowerCase(),
                buyerPhone: null,
                buddyEmail: null,
                selectedTierId: selectedTierId || null,
                selectedUpgradePlanId: selectedUpgradePlanId || null,
                selectedAddOnIds,
                selectedToolkitIds,
                selectedSessionIds: upgradePlanIncludedSessionIds,
                amountPaid: 0,
                razorpayOrderId: `buddy_${dummyOrderId}`,
                razorpayPaymentId: `free_buddy_payment_${Date.now()}`,
                couponId: appliedCoupon ? appliedCoupon.id : null,
                status: "paid",
                isVerified: true,
              });
            }
          }
        } catch (buddyErr) {
          console.error(
            "Failed to grant buddy access for free order:",
            buddyErr
          );
        }
      }

      void sendSprintPaymentConfirmationEmail(newOrder[0].id).catch((err) => {
        console.error("Failed to send zero-amount sprint email async:", err);
      });

      return NextResponse.json({
        success: true,
        free: true,
        freeOrder: true,
        orderId: dummyOrderId,
        amount: 0,
        currency: "INR",
        sprintOrderId: newOrder[0].id,
        orderRecord: newOrder[0],
      });
    }

    const razorpayOrder = await createOrder({
      amount: finalAmount * 100, // In paise
      currency: "INR",
      receipt: `rcpt_sp_${Date.now()}`,
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
        isVerified: isVerifiedFromPrevious,
        registrationCompletedAt: registrationCompletedAtFromPrevious,
        registrationName: registrationNameFromPrevious,
        registrationCollege: registrationCollegeFromPrevious,
        registrationCourse: registrationCourseFromPrevious,
        registrationMobileNumber: registrationMobileNumberFromPrevious,
        registrationYear: registrationYearFromPrevious,
        registrationCity: registrationCityFromPrevious,
        registrationExpectations: registrationExpectationsFromPrevious,
        registrationConsent: registrationConsentFromPrevious,
      })
      .returning();

    return NextResponse.json({
      success: true,
      free: false,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key:
        process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      sprintOrderId: newOrder[0].id,
      orderRecord: newOrder[0],
    });
  } catch (error) {
    console.error("Error creating sprint checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout order" },
      { status: 500 }
    );
  }
}
