import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortOrders, cohorts, userToolkits } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";
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

    // 1. Verify signature
    const secret = razorpayKeySecret;
    const expectedSignature = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
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
      .update(cohortOrders)
      .set({
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
      })
      .where(
        and(
          eq(cohortOrders.cohortId, cohortId),
          eq(cohortOrders.razorpayOrderId, razorpay_order_id)
        )
      );

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
