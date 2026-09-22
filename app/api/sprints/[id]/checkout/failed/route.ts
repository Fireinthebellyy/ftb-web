import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintOrders } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sprintId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, reason } = await request.json();

    if (!razorpay_order_id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    await db
      .update(sprintOrders)
      .set({
        status: "failed",
      })
      .where(
        and(
          eq(sprintOrders.sprintId, sprintId),
          eq(sprintOrders.razorpayOrderId, razorpay_order_id),
          eq(sprintOrders.userId, session.user.id),
          eq(sprintOrders.status, "created")
        )
      );

    return NextResponse.json({ success: true, logged: true, reason });
  } catch (error) {
    console.error("Error logging failed sprint payment:", error);
    return NextResponse.json(
      { error: "Failed to record transaction status" },
      { status: 500 }
    );
  }
}
