import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits, userToolkits } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, and } from "drizzle-orm";

// GET specific toolkit by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;

    // Get the toolkit details
    const toolkit = await db
      .select()
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!toolkit || toolkit.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    // Check if user has purchased this toolkit
    const user = await getCurrentUser();
    let hasPurchased = false;

    if (user && user.currentUser?.id) {
      const purchase = await db
        .select()
        .from(userToolkits)
        .where(
          and(
            eq(userToolkits.userId, user.currentUser.id),
            eq(userToolkits.toolkitId, toolkitId),
            eq(userToolkits.paymentStatus, "completed")
          )
        )
        .limit(1);

      hasPurchased = purchase.length > 0;
    }

    return NextResponse.json({
      toolkit: toolkit[0],
      hasPurchased,
    });
  } catch (error) {
    console.error("Error fetching toolkit:", error);
    return NextResponse.json(
      { error: "Failed to fetch toolkit" },
      { status: 500 }
    );
  }
}

// POST initiate purchase toolkit
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;
    const user = await getCurrentUser();

    if (!user || !user.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if toolkit exists
    const toolkit = await db
      .select()
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!toolkit || toolkit.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    // Check if user already purchased this toolkit
    const existingPurchase = await db
      .select()
      .from(userToolkits)
      .where(
        and(
          eq(userToolkits.userId, user.currentUser.id),
          eq(userToolkits.toolkitId, toolkitId),
          eq(userToolkits.paymentStatus, "completed")
        )
      )
      .limit(1);

    if (existingPurchase.length > 0) {
      return NextResponse.json(
        { error: "Toolkit already purchased" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const { createOrder } = await import("@/lib/razorpay");
    const order = await createOrder({
      amount: toolkit[0].price,
      currency: "INR",
      receipt: `tk_${toolkitId.slice(-8)}_${Date.now().toString().slice(-8)}`,
    });

    // Insert purchase record with pending status
    const newPurchase = await db
      .insert(userToolkits)
      .values({
        userId: user.currentUser.id,
        toolkitId: toolkitId,
        razorpayOrderId: order.id,
        paymentStatus: "pending",
        amountPaid: Number(order.amount),
      })
      .returning();

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
      purchase: newPurchase[0],
      toolkit: toolkit[0],
    });
  } catch (error) {
    console.error("Error initiating purchase:", error);
    return NextResponse.json(
      { error: "Failed to initiate purchase" },
      { status: 500 }
    );
  }
}
