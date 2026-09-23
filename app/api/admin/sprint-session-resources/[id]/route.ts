import { NextResponse } from "next/server";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sprintSessionResources } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: resourceId } = await params;
    const body = await request.json();
    const { name, url, type, orderIndex } = body;

    const updated = await db
      .update(sprintSessionResources)
      .set({
        name: name || undefined,
        url: url || undefined,
        type: type || undefined,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : undefined,
      })
      .where(eq(sprintSessionResources.id, resourceId))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating sprint resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
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
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resourceId } = await params;

    await db
      .delete(sprintSessionResources)
      .where(eq(sprintSessionResources.id, resourceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sprint resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
