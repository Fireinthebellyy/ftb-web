import { NextResponse } from "next/server";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sprintUpgradePlans } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId, planId } = await params;
    const body = await request.json();

    const {
      title,
      sectionLabel,
      description,
      price,
      originalPrice,
      includedSessionCount,
      includedSessionIds,
      isAllInOne,
      badgeText,
      features,
      orderIndex,
      isActive,
    } = body;

    const updated = await db
      .update(sprintUpgradePlans)
      .set({
        title: title?.trim(),
        sectionLabel: sectionLabel || null,
        description: description || null,
        price: price !== undefined ? Number(price) : undefined,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        includedSessionCount: includedSessionCount ? Number(includedSessionCount) : 1,
        includedSessionIds: Array.isArray(includedSessionIds) ? includedSessionIds : [],
        isAllInOne: Boolean(isAllInOne),
        badgeText: badgeText || null,
        features: Array.isArray(features) ? features : [],
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      })
      .where(
        and(
          eq(sprintUpgradePlans.id, planId),
          eq(sprintUpgradePlans.sprintId, sprintId)
        )
      )
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { error: "Upgrade plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating sprint upgrade plan:", error);
    return NextResponse.json(
      { error: "Failed to update upgrade plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId, planId } = await params;

    await db
      .delete(sprintUpgradePlans)
      .where(
        and(
          eq(sprintUpgradePlans.id, planId),
          eq(sprintUpgradePlans.sprintId, sprintId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sprint upgrade plan:", error);
    return NextResponse.json(
      { error: "Failed to delete upgrade plan" },
      { status: 500 }
    );
  }
}
