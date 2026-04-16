import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  discountAmount: z.number().int().positive(),
  discountType: z.enum(["fixed", "percentage"]).default("fixed"), // ✅ ADDED
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
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
        discountType: validatedData.discountType, // ✅ ADDED
        maxUses: validatedData.maxUses ?? null,
        maxUsesPerUser: validatedData.maxUsesPerUser,
        isActive: validatedData.isActive,
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