import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortOrders, cohorts, coupons, userToolkits, user } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { razorpayKeySecret } from "@/lib/razorpay";
import { sendCohortPaymentConfirmationEmail } from "@/lib/cohort-payment-email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const cohortId = paramsResolved.id;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay verification fields" },
        { status: 400 }
      );
    }

    // 1. Verify signature (timing-safe to prevent timing attacks)
    const secret = razorpayKeySecret;
    const expectedSignature = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "hex");
    const receivedBuf = Buffer.from(razorpay_signature, "hex");
    const signaturesMatch =
      expectedBuf.length === receivedBuf.length &&
      timingSafeEqual(expectedBuf, receivedBuf);

    if (!signaturesMatch) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 3. Find and update the order
    const existingOrder = await db.query.cohortOrders.findFirst({
      where: and(
        eq(cohortOrders.cohortId, cohortId),
        eq(cohortOrders.razorpayOrderId, razorpay_order_id)
      ),
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order record not found" },
        { status: 404 }
      );
    }

    if (existingOrder.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wasAlreadyPaid = existingOrder.status === "paid";

    // Update order status to paid
    await db
    // Update order status to paid — only if currently pending (prevents replay)
    const updatedOrders = await db
      .update(cohortOrders)
      .set({
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
      })
      .where(
        and(
          eq(cohortOrders.cohortId, cohortId),
          eq(cohortOrders.razorpayOrderId, razorpay_order_id),
          eq(cohortOrders.status, "pending")
        )
      )
      .returning({ couponId: cohortOrders.couponId });

    if (updatedOrders.length === 0) {
      // Order already verified or not found in pending state
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // Increment coupon usage if a coupon was applied
    const appliedCouponId = updatedOrders[0].couponId;
    if (appliedCouponId) {
      await db
        .update(coupons)
        .set({ currentUses: sql`${coupons.currentUses} + 1` })
        .where(eq(coupons.id, appliedCouponId));
    }

    // If cohort is linked to a toolkit, grant content access
    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, cohortId),
    });

    if (cohort?.toolkitId) {
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
          amountPaid: existingOrder.amountPaid, // In paise
        });
      }

      // If a buddy email was specified, also grant them access to this toolkit if their user account exists
      if (existingOrder.buddyEmail) {
        try {
          const buddyUser = await db.query.user.findFirst({
            where: eq(user.email, existingOrder.buddyEmail.trim().toLowerCase()),
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
          console.error("Error granting cohort toolkit access to buddy:", e);
        }
      }
    }

    // Grant access to selected toolkit add-ons
    if (existingOrder.selectedToolkitIds && Array.isArray(existingOrder.selectedToolkitIds)) {
      for (const tkId of existingOrder.selectedToolkitIds as string[]) {
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
            amountPaid: 0, // Price was paid as part of the overall transaction
          });
        }
      }
    }

    if (!wasAlreadyPaid) {
      sendCohortPaymentConfirmationEmail(existingOrder.id).catch((emailError) => {
        console.error("Cohort payment confirmation email failed:", emailError);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying payment signature:", error);
    return NextResponse.json(
      { error: "Failed to verify signature" },
      { status: 500 }
    );
  }
}
