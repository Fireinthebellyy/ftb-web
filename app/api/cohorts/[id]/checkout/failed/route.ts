import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohortOrders } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cohortId } = await params;
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
      .update(cohortOrders)
      .set({
        status: "failed",
      })
      .where(
        and(
          eq(cohortOrders.cohortId, cohortId),
          eq(cohortOrders.razorpayOrderId, razorpay_order_id),
          eq(cohortOrders.userId, session.user.id),
          eq(cohortOrders.status, "pending")
        )
      );

    return NextResponse.json({ success: true, logged: true, reason });
  } catch (error) {
    console.error("Error logging failed cohort payment:", error);
    return NextResponse.json(
      { error: "Failed to record transaction status" },
      { status: 500 }
    );
  }
}
