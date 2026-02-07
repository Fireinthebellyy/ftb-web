import { NextResponse } from "next/server";
import { db, dbPool } from "@/lib/db";
import {
  toolkits,
  toolkitContentItems,
  user,
  userToolkits,
  userToolkitProgress,
  coupons,
} from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, and, asc, sql, or, lt, isNull } from "drizzle-orm";

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
      // Perform all coupon operations atomically within a transaction
      try {
        const couponResult = await dbPool.transaction(async (tx) => {
          // Read coupon within transaction
          const couponData = await tx
            .select()
            .from(coupons)
            .where(eq(coupons.code, couponCode.toUpperCase().trim()))
            .limit(1);

          if (!couponData || couponData.length === 0) {
            throw new Error("INVALID_COUPON");
          }

          const coupon = couponData[0];

          // Validate coupon (non-atomic checks)
          if (!coupon.isActive) {
            throw new Error("COUPON_NOT_ACTIVE");
          }

          if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            throw new Error("COUPON_EXPIRED");
          }

          // Check per-user limit within transaction
          const userCouponUses = await tx
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
          // Only check limit if maxUsesPerUser is set (null/undefined means no limit)
          if (
            coupon.maxUsesPerUser != null &&
            usesCount >= coupon.maxUsesPerUser
          ) {
            throw new Error("COUPON_ALREADY_USED");
          }

          // Check overall coupon usage limit (treat null currentUses as zero)
          const currentUses = coupon.currentUses ?? 0;
          if (coupon.maxUses !== null && currentUses >= coupon.maxUses) {
            throw new Error("COUPON_LIMIT_REACHED");
          }

          // Conditionally increment coupon usage only if limit not reached
          // WHERE clause ensures atomic check: currentUses < maxUses OR maxUses IS NULL
          const updateResult = await tx
            .update(coupons)
            .set({
              currentUses: sql`${coupons.currentUses} + 1`,
            })
            .where(
              and(
                eq(coupons.id, coupon.id),
                or(
                  lt(coupons.currentUses, coupons.maxUses),
                  isNull(coupons.maxUses)
                )
              )
            )
            .returning();

          // Verify the update affected exactly one row
          // If not, throw to rollback transaction
          if (!updateResult || updateResult.length === 0) {
            throw new Error("COUPON_LIMIT_REACHED");
          }

          // Return success with coupon data
          return {
            coupon,
            discountAmount: coupon.discountAmount,
            couponId: coupon.id,
          };
        });

        // Calculate final price
        discountAmount = couponResult.discountAmount;
        finalPrice = Math.max(0, toolkit.price - discountAmount);
        couponId = couponResult.couponId;
      } catch (error) {
        // Handle transaction errors and validation failures
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        if (errorMessage === "INVALID_COUPON") {
          return NextResponse.json(
            { error: "Invalid coupon code" },
            { status: 400 }
          );
        }
        if (errorMessage === "COUPON_NOT_ACTIVE") {
          return NextResponse.json(
            { error: "Coupon is not active" },
            { status: 400 }
          );
        }
        if (errorMessage === "COUPON_EXPIRED") {
          return NextResponse.json(
            { error: "Coupon has expired" },
            { status: 400 }
          );
        }
        if (errorMessage === "COUPON_ALREADY_USED") {
          return NextResponse.json(
            { error: "You have already used this coupon" },
            { status: 400 }
          );
        }
        if (errorMessage === "COUPON_LIMIT_REACHED") {
          return NextResponse.json(
            { error: "Coupon usage limit reached" },
            { status: 400 }
          );
        }

        // Re-throw unexpected errors
        throw error;
      }
    }

    // If final price is 0 (fully covered by coupon), skip payment and grant access directly
    if (finalPrice <= 0) {
      const newPurchase = await db
        .insert(userToolkits)
        .values({
          userId: userSession.currentUser.id,
          toolkitId: toolkitId,
          razorpayOrderId: null,
          paymentStatus: "completed",
          amountPaid: 0,
          couponId: couponId,
        })
        .returning();

      return NextResponse.json({
        success: true,
        free: true,
        purchase: newPurchase[0],
        toolkit,
        discountAmount,
        finalPrice: 0,
      });
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
      free: false,
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
