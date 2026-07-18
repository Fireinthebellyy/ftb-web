import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  discountAmount: z.number().int().positive(),
  discountType: z.enum(["fixed", "percentage"]).default("fixed"),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  cohortOnly: z.boolean().default(false),
  expiresAt: z.string().datetime().nullable().optional(),
});

const bulkCreateCouponSchema = z.object({
  codes: z.array(z.string().min(1).max(50)).min(1),
  discountAmount: z.number().int().positive(),
  discountType: z.enum(["fixed", "percentage"]).default("fixed"),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  cohortOnly: z.boolean().default(false),
  expiresAt: z.string().datetime().nullable().optional(),
});

const bulkUpdateCouponSchema = z.object({
  couponIds: z.array(z.string()).min(1),
  discountAmount: z.number().int().positive().optional(),
  discountType: z.enum(["fixed", "percentage"]).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  cohortOnly: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: Request) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;

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

    const allCoupons = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt));

    activityStatus = 200;
    return NextResponse.json({ coupons: allCoupons });
  } catch (error) {
    activityError = error;
    console.error("Error fetching coupons:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.coupons.list",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "coupon",
      error: activityError,
    });
  }
}

export async function POST(request: Request) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
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

    const body = await request.json();

    // Check if this is a bulk update request
    if (body.couponIds && Array.isArray(body.couponIds)) {
      const validatedData = bulkUpdateCouponSchema.parse(body);

      if (Object.keys(validatedData).filter(k => k !== 'couponIds').length === 0) {
        activityStatus = 400;
        activityError = "Empty update payload";
        return NextResponse.json(
          { error: "At least one field to update must be provided" },
          { status: 400 }
        );
      }

      const updateData: any = {};
      if (validatedData.discountAmount !== undefined) {
        updateData.discountAmount = validatedData.discountAmount;
      }
      if (validatedData.discountType !== undefined) {
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
      if (validatedData.cohortOnly !== undefined) {
        updateData.cohortOnly = validatedData.cohortOnly;
      }
      if (validatedData.expiresAt !== undefined) {
        updateData.expiresAt = validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null;
      }

      const updatedCoupons = await db
        .update(coupons)
        .set(updateData)
        .where(inArray(coupons.id, validatedData.couponIds))
        .returning();

      activityAfterState = updatedCoupons;
      activityStatus = 200;
      return NextResponse.json({ coupons: updatedCoupons }, { status: 200 });
    }

    // Check if this is a bulk creation request
    if (body.codes && Array.isArray(body.codes)) {
      const validatedData = bulkCreateCouponSchema.parse(body);

      // Check for existing codes
      const existingCodes = await db
        .select({ code: coupons.code })
        .from(coupons)
        .where(eq(coupons.code, validatedData.codes[0].toUpperCase().trim()));

      if (existingCodes.length > 0) {
        activityStatus = 400;
        activityError = "One or more coupon codes already exist";
        return NextResponse.json(
          { error: "One or more coupon codes already exist" },
          { status: 400 }
        );
      }

      // Create multiple coupons
      const newCoupons = await db
        .insert(coupons)
        .values(
          validatedData.codes.map((code) => ({
            code: code.toUpperCase().trim(),
            discountAmount: validatedData.discountAmount,
            discountType: validatedData.discountType,
            maxUses: validatedData.maxUses ?? null,
            maxUsesPerUser: validatedData.maxUsesPerUser,
            isActive: validatedData.isActive,
            cohortOnly: validatedData.cohortOnly,
            expiresAt: validatedData.expiresAt
              ? new Date(validatedData.expiresAt)
              : null,
            currentUses: 0,
          }))
        )
        .returning();

      activityAfterState = newCoupons;
      activityStatus = 201;
      return NextResponse.json({ coupons: newCoupons }, { status: 201 });
    }

    // Single coupon creation
    const validatedData = createCouponSchema.parse(body);

    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, validatedData.code.toUpperCase().trim()))
      .limit(1);

    if (existingCoupon.length > 0) {
      activityStatus = 400;
      activityError = "Coupon code already exists";
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const newCoupon = await db
      .insert(coupons)
      .values({
        code: validatedData.code.toUpperCase().trim(),
        discountAmount: validatedData.discountAmount,
        discountType: validatedData.discountType,
        maxUses: validatedData.maxUses ?? null,
        maxUsesPerUser: validatedData.maxUsesPerUser,
        isActive: validatedData.isActive,
        cohortOnly: validatedData.cohortOnly,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        currentUses: 0,
      })
      .returning();

    activityAfterState = newCoupon[0];
    activityStatus = 201;
    return NextResponse.json({ coupon: newCoupon[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      activityStatus = 400;
      activityError = error.errors;
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    activityError = error;
    console.error("Error creating coupon:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.coupons.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "coupon",
      afterState: activityAfterState,
      error: activityError,
    });
  }
}