import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits, toolkitContentItems, user } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, and, asc } from "drizzle-orm";

// GET specific toolkit by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;

    const toolkitResult = await db
      .select({
        id: toolkits.id,
        title: toolkits.title,
        description: toolkits.description,
        price: toolkits.price,
        originalPrice: toolkits.originalPrice,
        coverImageUrl: toolkits.coverImageUrl,
        videoUrl: toolkits.videoUrl,
        contentUrl: toolkits.contentUrl,
        category: toolkits.category,
        highlights: toolkits.highlights,
        totalDuration: toolkits.totalDuration,
        lessonCount: toolkits.lessonCount,
        isActive: toolkits.isActive,
        createdAt: toolkits.createdAt,
        updatedAt: toolkits.updatedAt,
        userId: toolkits.userId,
        creatorName: user.name,
      })
      .from(toolkits)
      .leftJoin(user, eq(toolkits.userId, user.id))
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!toolkitResult || toolkitResult.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    const toolkit = toolkitResult[0];

    const contentItemsResult = await db
      .select()
      .from(toolkitContentItems)
      .where(eq(toolkitContentItems.toolkitId, toolkitId))
      .orderBy(asc(toolkitContentItems.orderIndex));

    const userSession = await getCurrentUser();
    let hasPurchased = false;

    if (userSession && userSession.currentUser?.id) {
      const { userToolkits } = await import("@/lib/schema");
      const purchase = await db
        .select()
        .from(userToolkits)
        .where(
          and(
            eq(userToolkits.userId, userSession.currentUser.id),
            eq(userToolkits.toolkitId, toolkitId),
            eq(userToolkits.paymentStatus, "completed")
          )
        )
        .limit(1);

      hasPurchased = purchase.length > 0;
    }

    return NextResponse.json({
      toolkit,
      contentItems: contentItemsResult,
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
    const userSession = await getCurrentUser();

    if (!userSession || !userSession.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const toolkitResult = await db
      .select()
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!toolkitResult || toolkitResult.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    const toolkit = toolkitResult[0];

    const { userToolkits } = await import("@/lib/schema");
    const existingPurchase = await db
      .select()
      .from(userToolkits)
      .where(
        and(
          eq(userToolkits.userId, userSession.currentUser.id),
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

    const { createOrder } = await import("@/lib/razorpay");
    const order = await createOrder({
      amount: toolkit.price * 100,
      currency: "INR",
      receipt: `tk_${toolkitId.slice(-8)}_${Date.now().toString().slice(-8)}`,
    });

    const newPurchase = await db
      .insert(userToolkits)
      .values({
        userId: userSession.currentUser.id,
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
      toolkit,
    });
  } catch (error) {
    console.error("Error initiating purchase:", error);
    return NextResponse.json(
      { error: "Failed to initiate purchase" },
      { status: 500 }
    );
  }
}
