import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintMentors } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> }
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

    const { id: sprintId, mentorId } = await params;
    const body = await request.json();
    const { name, role, imageUrl, bio, link, orderIndex } = body;

    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { error: "Mentor name cannot be empty" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(sprintMentors)
      .set({
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(role !== undefined ? { role: role?.trim() || "" } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl?.trim() || null } : {}),
        ...(bio !== undefined ? { bio: bio?.trim() || null } : {}),
        ...(link !== undefined ? { link: link?.trim() || null } : {}),
        ...(orderIndex !== undefined ? { orderIndex: Number(orderIndex) } : {}),
      })
      .where(and(eq(sprintMentors.id, mentorId), eq(sprintMentors.sprintId, sprintId)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating sprint mentor:", error);
    return NextResponse.json(
      { error: "Failed to update sprint mentor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> }
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

    const { id: sprintId, mentorId } = await params;

    const deleted = await db
      .delete(sprintMentors)
      .where(and(eq(sprintMentors.id, mentorId), eq(sprintMentors.sprintId, sprintId)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sprint mentor:", error);
    return NextResponse.json(
      { error: "Failed to delete sprint mentor" },
      { status: 500 }
    );
  }
}
