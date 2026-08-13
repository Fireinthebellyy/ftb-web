import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { cohorts, cohortTiers, cohortOrders, coupons, userToolkits, toolkits, user, cohortSessions, siteSettings } from "@/lib/schema";
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
      couponCode,
      validateCouponOnly = false,
    } = body;
    
    let { buddyEmail } = body;

    if (!buyerName || !buyerEmail) {
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

    // Skip validation for coupon-only validation
    if (!validateCouponOnly) {
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
    }

    // 1. Verify Cohort
    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, cohortId),
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    // 1.5. Check for duplicate session purchases and update existing order if user already has cohort access
    if (selectedAddOnIds.length > 0) {
      const existingOrder = await db.query.cohortOrders.findFirst({
        where: and(
          eq(cohortOrders.userId, userId),
          eq(cohortOrders.cohortId, cohortId),
          eq(cohortOrders.status, "paid")
        ),
      });

      if (existingOrder) {
        // User already has cohort access, check for duplicate sessions
        if (existingOrder.selectedAddOnIds && Array.isArray(existingOrder.selectedAddOnIds)) {
          const alreadyPurchased = selectedAddOnIds.filter((id: string) => 
            existingOrder.selectedAddOnIds.includes(id)
          );
          
          if (alreadyPurchased.length > 0) {
            return NextResponse.json(
              { 
                error: "You already have access to some of these sessions",
                alreadyPurchasedSessions: alreadyPurchased
              },
              { status: 400 }
            );
          }
        }

        // If no duplicates, this is an add-on purchase for existing user
        // Merge the new sessions with existing ones
        const mergedAddOnIds = [
          ...(existingOrder.selectedAddOnIds || []),
          ...selectedAddOnIds
        ];

        // Calculate price for new sessions only
        let addonsTotal = 0;
        const newSessions = await db
          .select()
          .from(cohortSessions)
          .where(
            and(
              eq(cohortSessions.cohortId, cohortId),
              inArray(cohortSessions.id, selectedAddOnIds)
            )
          );

        newSessions.forEach((session) => {
          addonsTotal += session.price || 0;
        });

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

        // Validate coupon for add-on purchase
        let addOnDiscountAmount = 0;
        let addOnCouponId: string | null = null;
        
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
              const isDuoActive = buddyEmail && buddyEmail.trim().length > 0;
              const subtotalForDiscount = (isDuoActive ? getDuoPricing(addonsTotal).final : addonsTotal) +
                                          toolkitsTotal;
              if (coupon.discountType === "percentage") {
                addOnDiscountAmount = Math.round((subtotalForDiscount * coupon.discountAmount) / 100);
              } else {
                addOnDiscountAmount = coupon.discountAmount;
              }
              addOnCouponId = coupon.id;
            }
          }
        }

        const isDuoActive = buddyEmail && buddyEmail.trim().length > 0;
        const finalAddonsTotal = isDuoActive ? getDuoPricing(addonsTotal).final : addonsTotal;
        const subtotal = finalAddonsTotal + toolkitsTotal;
        const finalPriceRupees = Math.max(0, subtotal - addOnDiscountAmount);
        const finalPricePaisa = finalPriceRupees * 100;

        // If price is 0, directly update the existing order
        if (finalPriceRupees <= 0) {
          await db
            .update(cohortOrders)
            .set({
              selectedAddOnIds: mergedAddOnIds,
              selectedToolkitIds: [
                ...(existingOrder.selectedToolkitIds || []),
                ...selectedToolkitIds
              ],
            })
            .where(eq(cohortOrders.id, existingOrder.id));

          // Grant access to new toolkit add-ons
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

          // Increment coupon usage if a coupon was applied
          if (addOnCouponId) {
            await db
              .update(coupons)
              .set({ currentUses: sql`${coupons.currentUses} + 1` })
              .where(eq(coupons.id, addOnCouponId));
          }

          return NextResponse.json({
            success: true,
            free: true,
            orderRecord: existingOrder,
          });
        }

        // Create Razorpay order for the additional sessions
        const receiptId = `ch_addon_${cohortId.slice(-6)}_${Date.now().toString().slice(-6)}`;
        const order = await createOrder({
          amount: finalPricePaisa,
          currency: "INR",
          receipt: receiptId,
        });

        // Store the pending add-on data in the existing order temporarily
        // We'll update it after payment verification
        await db
          .update(cohortOrders)
          .set({
            pendingAddOnIds: selectedAddOnIds,
            pendingToolkitIds: selectedToolkitIds,
            pendingCouponId: addOnCouponId,
            pendingAmount: finalPricePaisa,
            pendingRazorpayOrderId: order.id,
          })
          .where(eq(cohortOrders.id, existingOrder.id));

        return NextResponse.json({
          success: true,
          free: false,
          order: {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
          },
          key: process.env.RAZORPAY_KEY_ID,
          orderRecord: existingOrder,
          isAddOnPurchase: true,
        });
      }
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
      const selectedSessions = await db
        .select()
        .from(cohortSessions)
        .where(
          and(
            eq(cohortSessions.cohortId, cohortId),
            inArray(cohortSessions.id, selectedAddOnIds)
          )
        );

      selectedSessions.forEach((session) => {
        addonsTotal += session.price || 0;
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
        } else {
          // Coupon invalid, reset discount
          discountAmount = 0;
          couponId = null;
        }
      } else {
        // Coupon not found
        discountAmount = 0;
        couponId = null;
      }
    }

    // 5. Compute Total price (in rupees)
    // Duo discount: double the price then apply 20% off. Toolkits are not discounted.
    const finalTierPrice = isDuoActive ? getDuoPricing(tierPrice).final : tierPrice;
    const finalAddonsTotal = isDuoActive ? getDuoPricing(addonsTotal).final : addonsTotal;

    const subtotal = finalTierPrice + finalAddonsTotal + toolkitsTotal;
    const finalPriceRupees = Math.max(0, subtotal - discountAmount);
    const finalPricePaisa = finalPriceRupees * 100; // Razorpay needs amount in paisa

    // If validateCouponOnly is true, just return the discount amount
    if (validateCouponOnly) {
      return NextResponse.json({
        success: true,
        discountAmount,
        finalPrice: finalPriceRupees,
      });
    }

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

      // If buddy email is added, grant them access to the cohort's linked toolkit if their account already exists.
      // Buddy does NOT get access to selectedToolkitIds add-on toolkits.
      if (buddyEmail && cohort.toolkitId) {
        try {
          const buddyUser = await db.query.user.findFirst({
            where: eq(user.email, buddyEmail.trim().toLowerCase()),
          });
          if (buddyUser) {
            // Grant toolkit access
            if (cohort.toolkitId) {
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

            // Create cohort order record for buddy to grant dashboard access
            const existingBuddyOrder = await db.query.cohortOrders.findFirst({
              where: and(
                eq(cohortOrders.userId, buddyUser.id),
                eq(cohortOrders.cohortId, cohortId),
                eq(cohortOrders.status, "paid")
              ),
            });
            if (!existingBuddyOrder) {
              await db.insert(cohortOrders).values({
                cohortId,
                userId: buddyUser.id,
                buyerName,
                buyerEmail: buddyEmail.trim().toLowerCase(),
                buyerPhone: buyerPhone || null,
                buddyEmail: null,
                selectedTierId: selectedTierId || null,
                selectedAddOnIds,
                selectedToolkitIds,
                amountPaid: 0,
                razorpayOrderId: `buddy_free_${newOrder.razorpayOrderId}`,
                couponId,
                status: "paid",
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
      key: process.env.RAZORPAY_KEY_ID,
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
