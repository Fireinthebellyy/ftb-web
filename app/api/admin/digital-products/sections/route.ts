import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/api-error";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { digitalProductSections } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";

const createSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  orderIndex: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser?.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "digital-products")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sections = await db
      .select()
      .from(digitalProductSections)
      .orderBy(asc(digitalProductSections.orderIndex), asc(digitalProductSections.title));

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching digital product sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch digital product sections" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser?.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "digital-products")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createSectionSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(validationResult.error);
    }

    const { title, description, orderIndex, isActive } = validationResult.data;
    const section = await db
      .insert(digitalProductSections)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        orderIndex: orderIndex ?? 0,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json(section[0], { status: 201 });
  } catch (error) {
    console.error("Error creating digital product section:", error);
    return NextResponse.json(
      { error: "Failed to create digital product section" },
      { status: 500 }
    );
  }
}
