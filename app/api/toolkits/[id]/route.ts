import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  toolkits,
  toolkitContentItems,
  user,
  userToolkits,
  userToolkitProgress,
  coupons,
} from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, and, asc, sql } from "drizzle-orm";

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
      .select({
        id: toolkitContentItems.id,
        toolkitId: toolkitContentItems.toolkitId,
        title: toolkitContentItems.title,
        type: toolkitContentItems.type,
        content: toolkitContentItems.content,
        bunnyVideoUrl: toolkitContentItems.bunnyVideoUrl,
        orderIndex: toolkitContentItems.orderIndex,
        createdAt: toolkitContentItems.createdAt,
        updatedAt: toolkitContentItems.updatedAt,
      })
      .from(toolkitContentItems)
      .where(eq(toolkitContentItems.toolkitId, toolkitId))
      .orderBy(asc(toolkitContentItems.orderIndex));

    const userSession = await getCurrentUser();
    let hasPurchased = false;
    let completedItemIds: string[] = [];

    if (userSession && userSession.currentUser?.id) {
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

      if (purchase.length > 0) {
        hasPurchased = true;

        // Fetch completed content items for this user and toolkit
        const completedProgress = await db
          .select({ contentItemId: userToolkitProgress.contentItemId })
          .from(userToolkitProgress)
          .where(
            and(
              eq(userToolkitProgress.userId, userSession.currentUser.id),
              eq(userToolkitProgress.toolkitId, toolkitId)
            )
          );

        completedItemIds = completedProgress.map((p) => p.contentItemId);
      }
    }

    return NextResponse.json({
      toolkit,
      contentItems: contentItemsResult,
      hasPurchased,
      completedItemIds,
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

    const body = await request.json();
    const couponCode = body.couponCode as string | undefined;

    const toolkitResult = await db
      .select()
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!toolkitResult || toolkitResult.length === 0) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    const toolkit = toolkitResult[0];

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

    // Validate and apply coupon if provided
    let finalPrice = toolkit.price;
    let couponId: string | null = null;
    let discountAmount = 0;

    if (couponCode) {
      const couponResult = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, couponCode.toUpperCase().trim()))
        .limit(1);

      if (!couponResult || couponResult.length === 0) {
        return NextResponse.json(
          { error: "Invalid coupon code" },
          { status: 400 }
        );
      }

      const coupon = couponResult[0];

      // Validate coupon
      if (!coupon.isActive) {
        return NextResponse.json(
          { error: "Coupon is not active" },
          { status: 400 }
        );
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "Coupon has expired" },
          { status: 400 }
        );
      }

      if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
        return NextResponse.json(
          { error: "Coupon usage limit reached" },
          { status: 400 }
        );
      }

      // Check per-user limit
      const userCouponUses = await db
        .select({ count: sql<number>`count(*)` })
        .from(userToolkits)
        .where(
          and(
            eq(userToolkits.userId, userSession.currentUser.id),
            eq(userToolkits.couponId, coupon.id),
            eq(userToolkits.paymentStatus, "completed")
          )
        );

      const usesCount = Number(userCouponUses[0]?.count || 0);
      if (usesCount >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          { error: "You have already used this coupon" },
          { status: 400 }
        );
      }

      // Calculate final price
      discountAmount = coupon.discountAmount;
      finalPrice = Math.max(0, toolkit.price - discountAmount);
      couponId = coupon.id;

      // Atomically increment coupon usage
      await db
        .update(coupons)
        .set({
          currentUses: sql`${coupons.currentUses} + 1`,
        })
        .where(eq(coupons.id, coupon.id));
    }

    const { createOrder } = await import("@/lib/razorpay");
    const order = await createOrder({
      amount: finalPrice * 100, // Convert to paisa
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
        couponId: couponId,
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
      discountAmount,
      finalPrice,
    });
  } catch (error) {
    console.error("Error initiating purchase:", error);
    return NextResponse.json(
      { error: "Failed to initiate purchase" },
      { status: 500 }
    );
  }
}
