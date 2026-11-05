import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coldDmTemplates, userColdDmTemplates } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment details" },
        { status: 400 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const razorpayOrderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${razorpay_order_id}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    if (!razorpayOrderResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to verify payment" },
        { status: 500 }
      );
    }

    const razorpayOrder = await razorpayOrderResponse.json();

    if (razorpayOrder.status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    const templateId = razorpayOrder.notes?.templateId;
    const userId = razorpayOrder.notes?.userId;

    if (!templateId || !userId) {
      return NextResponse.json(
        { success: false, error: "Invalid order metadata" },
        { status: 400 }
      );
    }

    if (userId !== currentUser.currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Payment belongs to different user" },
        { status: 400 }
      );
    }

    const existingPurchase = await db.query.userColdDmTemplates.findFirst({
      where: eq(userColdDmTemplates.templateId, templateId),
    });

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        message: "Template already purchased",
      });
    }

    const template = await db.query.coldDmTemplates.findFirst({
      where: eq(coldDmTemplates.id, templateId),
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    await db.insert(userColdDmTemplates).values({
      userId: currentUser.currentUser.id,
      templateId,
      purchaseDate: new Date(),
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentStatus: "completed",
      amountPaid: razorpayOrder.amount / 100,
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Error verifying Cold DM payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
