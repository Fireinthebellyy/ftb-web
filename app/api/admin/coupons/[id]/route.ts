import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  discountAmount: z.number().int().positive().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const couponId = paramsResolved.id;

    const body = await request.json();
    const validatedData = updateCouponSchema.parse(body);

    // Check if coupon exists
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, couponId))
      .limit(1);

    if (existingCoupon.length === 0) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    // If code is being updated, check for duplicates
    if (validatedData.code) {
      const duplicateCoupon = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, validatedData.code.toUpperCase().trim()))
        .limit(1);

      if (
        duplicateCoupon.length > 0 &&
        duplicateCoupon[0].id !== couponId
      ) {
        return NextResponse.json(
          { error: "Coupon code already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validatedData.code !== undefined) {
      updateData.code = validatedData.code.toUpperCase().trim();
    }
    if (validatedData.discountAmount !== undefined) {
      updateData.discountAmount = validatedData.discountAmount;
    }
    if (validatedData.maxUses !== undefined) {
      updateData.maxUses = validatedData.maxUses;
    }
    if (validatedData.maxUsesPerUser !== undefined) {
      updateData.maxUsesPerUser = validatedData.maxUsesPerUser;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }
    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt
        ? new Date(validatedData.expiresAt)
        : null;
    }

    const updatedCoupon = await db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, couponId))
      .returning();

    return NextResponse.json({ coupon: updatedCoupon[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const couponId = paramsResolved.id;

    // Check if coupon exists
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, couponId))
      .limit(1);

    if (existingCoupon.length === 0) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    await db.delete(coupons).where(eq(coupons.id, couponId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
