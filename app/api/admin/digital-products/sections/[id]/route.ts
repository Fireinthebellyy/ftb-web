import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/api-error";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { digitalProductSections } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";

const updateSectionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional(),
  orderIndex: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser?.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "digital-products")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateSectionSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(validationResult.error);
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const { title, description, orderIndex, isActive } = validationResult.data;

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (orderIndex !== undefined) updates.orderIndex = orderIndex;
    if (isActive !== undefined) updates.isActive = isActive;

    const section = await db
      .update(digitalProductSections)
      .set(updates)
      .where(eq(digitalProductSections.id, id))
      .returning();

    if (!section.length) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(section[0]);
  } catch (error) {
    console.error("Error updating digital product section:", error);
    return NextResponse.json(
      { error: "Failed to update digital product section" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser?.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "digital-products")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deletedSection = await db
      .delete(digitalProductSections)
      .where(eq(digitalProductSections.id, id))
      .returning();

    if (!deletedSection.length) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting digital product section:", error);
    return NextResponse.json(
      { error: "Failed to delete digital product section" },
      { status: 500 }
    );
  }
}
