import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintOrders, sprints, coupons, userToolkits, user } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { razorpayKeySecret } from "@/lib/razorpay";
import { sendSprintPaymentConfirmationEmail } from "@/lib/sprint-payment-email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const sprintId = paramsResolved.id;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay verification fields" },
        { status: 400 }
      );
    }

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

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const existingOrder = await db.query.sprintOrders.findFirst({
      where: and(
        eq(sprintOrders.sprintId, sprintId),
        eq(sprintOrders.razorpayOrderId, razorpay_order_id)
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

    const updatedOrders = await db
      .update(sprintOrders)
      .set({
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
      })
      .where(
        and(
          eq(sprintOrders.sprintId, sprintId),
          eq(sprintOrders.razorpayOrderId, razorpay_order_id),
          eq(sprintOrders.status, "created")
        )
      )
      .returning({ couponId: sprintOrders.couponId });

    if (updatedOrders.length === 0) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const appliedCouponId = updatedOrders[0].couponId;
    if (appliedCouponId) {
      await db
        .update(coupons)
        .set({ currentUses: sql`${coupons.currentUses} + 1` })
        .where(eq(coupons.id, appliedCouponId));
    }

    // If sprint is linked to a toolkit, grant content access
    const sprint = await db.query.sprints.findFirst({
      where: eq(sprints.id, sprintId),
    });

    if (sprint?.toolkitId) {
      const existingUserToolkit = await db.query.userToolkits.findFirst({
        where: and(
          eq(userToolkits.userId, userId),
          eq(userToolkits.toolkitId, sprint.toolkitId)
        ),
      });

      if (!existingUserToolkit) {
        await db.insert(userToolkits).values({
          userId,
          toolkitId: sprint.toolkitId,
          paymentStatus: "completed",
          amountPaid: existingOrder.amountPaid,
        });
      }

      // If a buddy email was specified, also grant them access to this toolkit and sprint if their user account exists
      if (existingOrder.buddyEmail) {
        try {
          const buddyUser = await db.query.user.findFirst({
            where: eq(user.email, existingOrder.buddyEmail.trim().toLowerCase()),
          });
          if (buddyUser) {
            // Grant toolkit access
            if (sprint.toolkitId) {
              const existingBuddyToolkit = await db.query.userToolkits.findFirst({
                where: and(
                  eq(userToolkits.userId, buddyUser.id),
                  eq(userToolkits.toolkitId, sprint.toolkitId)
                ),
              });
              if (!existingBuddyToolkit) {
                await db.insert(userToolkits).values({
                  userId: buddyUser.id,
                  toolkitId: sprint.toolkitId,
                  paymentStatus: "completed",
                  amountPaid: 0,
                });
              }
            }

            // Create sprint order record for buddy to grant dashboard access
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
                buyerName: existingOrder.buyerName,
                buyerEmail: existingOrder.buddyEmail,
                buyerPhone: null,
                buddyEmail: null,
                selectedTierId: existingOrder.selectedTierId,
                selectedAddOnIds: existingOrder.selectedAddOnIds,
                selectedToolkitIds: existingOrder.selectedToolkitIds,
                amountPaid: 0,
                razorpayOrderId: `buddy_${existingOrder.razorpayOrderId}`,
                razorpayPaymentId: existingOrder.razorpayPaymentId,
                couponId: existingOrder.couponId,
                status: "paid",
              });
            }
          }
        } catch (e) {
          console.error("Error granting sprint access to buddy:", e);
        }
      }
    }

    const selectedToolkitIds = (existingOrder.selectedToolkitIds as string[]) || [];
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

    if (!wasAlreadyPaid) {
      void sendSprintPaymentConfirmationEmail(existingOrder.id).catch(err => {
        console.error("Failed to send sprint payment confirmation email async:", err);
      });
    }

    return NextResponse.json({
      success: true,
      orderId: existingOrder.id,
      registrationUrl: `/toolkit/sprints/${sprintId}/registration`,
    });
  } catch (error) {
    console.error("Error verifying sprint checkout:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
