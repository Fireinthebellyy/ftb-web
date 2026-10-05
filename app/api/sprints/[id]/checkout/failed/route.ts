import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintOrders, sprints } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveSprint(identifier: string) {
  if (UUID_REGEX.test(identifier)) {
    return db.query.sprints.findFirst({
      where: eq(sprints.id, identifier),
    });
  }

  return db.query.sprints.findFirst({
    where: eq(sprints.slug, identifier),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: identifier } = await params;
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

    const sprint = await resolveSprint(identifier);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }
    const sprintId = sprint.id;

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
