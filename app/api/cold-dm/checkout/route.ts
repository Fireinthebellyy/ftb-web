import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coldDmTemplates, userColdDmTemplates } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.currentUser) {
      return NextResponse.json(
        { success: false, error: "Please login to purchase template" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "Template ID is required" },
        { status: 400 }
      );
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

    if (!template.isActive) {
      return NextResponse.json(
        { success: false, error: "Template is not active" },
        { status: 400 }
      );
    }

    const existingPurchase = await db.query.userColdDmTemplates.findFirst({
      where: eq(userColdDmTemplates.templateId, templateId),
    });

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: "You already own this template" },
        { status: 400 }
      );
    }

    const amountInPaisa = template.price * 100;

    const razorpayOrderResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          amount: amountInPaisa,
          currency: "INR",
          receipt: `cold-dm-${templateId}`,
          notes: {
            templateId,
            userId: currentUser.currentUser.id,
          },
        }),
      }
    );

    if (!razorpayOrderResponse.ok) {
      const errorData = await razorpayOrderResponse.json();
      console.error("Razorpay order creation error:", errorData);
      return NextResponse.json(
        { success: false, error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    const razorpayOrder = await razorpayOrderResponse.json();

    return NextResponse.json({
      success: true,
      order: razorpayOrder,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      template: {
        id: template.id,
        title: template.title,
        price: template.price,
        originalPrice: template.originalPrice,
        checkoutTitle: template.checkoutTitle,
        checkoutDescription: template.checkoutDescription,
        benefits: template.benefits || undefined,
      },
    });
  } catch (error) {
    console.error("Error creating Cold DM checkout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
