import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  discountAmount: z.number().int().positive().optional(),
  discountType: z.enum(["fixed", "percentage"]).optional(), // ✅ ADDED
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;
  let activityAfterState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const couponId = paramsResolved.id;
    activityEntityId = couponId;

    try {
      const body = await request.json();
      const validatedData = updateCouponSchema.parse(body);

      if (Object.keys(validatedData).length === 0) {
        activityStatus = 400;
        activityError = "Empty update payload";
        return NextResponse.json(
          { error: "Empty update payload. At least one field must be provided." },
          { status: 400 }
        );
      }

      const existingCoupon = await db
        .select()
        .from(coupons)
        .where(eq(coupons.id, couponId))
        .limit(1);

      if (existingCoupon.length === 0) {
        activityStatus = 404;
        activityError = "Coupon not found";
        return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      }
      activityBeforeState = existingCoupon[0];

      if (validatedData.code) {
        const duplicateCoupon = await db
          .select()
          .from(coupons)
          .where(eq(coupons.code, validatedData.code.toUpperCase().trim()))
          .limit(1);

        if (duplicateCoupon.length > 0 && duplicateCoupon[0].id !== couponId) {
          activityStatus = 400;
          activityError = "Coupon code already exists";
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
      if (validatedData.discountType !== undefined) { // ✅ ADDED
        updateData.discountType = validatedData.discountType;
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

      activityAfterState = updatedCoupon[0];
      activityStatus = 200;
      return NextResponse.json({ coupon: updatedCoupon[0] });
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof TypeError) {
        activityStatus = 400;
        activityError = "Invalid JSON in request body";
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => {
          const field = err.path.join(".");
          return `${field ? `${field}: ` : ""}${err.message}`;
        });
        const errorMessage =
          errorMessages.length === 1
            ? errorMessages[0]
            : `Validation failed: ${errorMessages.join("; ")}`;
        activityStatus = 400;
        activityError = error.errors;
        return NextResponse.json(
          { error: errorMessage, details: error.errors },
          { status: 400 }
        );
      }

      activityError = error;
      console.error("Error updating coupon:", error);
      activityStatus = 500;
      return NextResponse.json(
        { error: "Failed to update coupon" },
        { status: 500 }
      );
    }
  } catch (error) {
    activityError = error;
    console.error("Error in PATCH handler:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.coupons.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "coupon",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}

// DELETE handler unchanged
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const couponId = paramsResolved.id;
    activityEntityId = couponId;

    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, couponId))
      .limit(1);

    if (existingCoupon.length === 0) {
      activityStatus = 404;
      activityError = "Coupon not found";
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    activityBeforeState = existingCoupon[0];

    await db.delete(coupons).where(eq(coupons.id, couponId));

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting coupon:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.coupons.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "coupon",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}