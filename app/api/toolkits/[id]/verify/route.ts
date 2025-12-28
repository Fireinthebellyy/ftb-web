import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userToolkits } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";

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
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Update the purchase record
    await db
      .update(userToolkits)
      .set({
        paymentId: razorpay_payment_id,
        paymentStatus: "completed",
      })
      .where(
        and(
          eq(userToolkits.toolkitId, toolkitId),
          eq(userToolkits.razorpayOrderId, razorpay_order_id)
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
