import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  discountAmount: z.number().int().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allCoupons = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt));

    return NextResponse.json({ coupons: allCoupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCouponSchema.parse(body);

    // Check if coupon code already exists
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, validatedData.code.toUpperCase().trim()))
      .limit(1);

    if (existingCoupon.length > 0) {
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
        maxUses: validatedData.maxUses ?? null,
        maxUsesPerUser: validatedData.maxUsesPerUser,
        isActive: validatedData.isActive,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        currentUses: 0,
      })
      .returning();

    return NextResponse.json({ coupon: newCoupon[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
