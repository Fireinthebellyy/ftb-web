import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userToolkits } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { razorpayKeySecret } from "@/lib/razorpay";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify signature
    const secret = razorpayKeySecret;
    const expectedSignature = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // First check if the purchase record exists and get its userId
    const existingPurchase = await db.query.userToolkits.findFirst({
      where: and(
        eq(userToolkits.toolkitId, toolkitId),
        eq(userToolkits.razorpayOrderId, razorpay_order_id)
      ),
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Purchase record not found" },
        { status: 404 }
      );
    }

    if (existingPurchase.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the purchase record (only if it belongs to the authenticated user)
    await db
      .update(userToolkits)
      .set({
        paymentId: razorpay_payment_id,
        paymentStatus: "completed",
      })
      .where(
        and(
          eq(userToolkits.toolkitId, toolkitId),
          eq(userToolkits.razorpayOrderId, razorpay_order_id),
          eq(userToolkits.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
