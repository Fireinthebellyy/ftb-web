import { NextResponse } from "next/server";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sprintSessionMentors } from "@/lib/schema";
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

    const { id: mentorId } = await params;
    const body = await request.json();

    const {
      name,
      role,
      imageUrl,
      bio,
      linkedinUrl,
      otherLinks,
      orderIndex,
      sprintMentorId,
    } = body;

    const updated = await db
      .update(sprintSessionMentors)
      .set({
        name: name || null,
        role: role || null,
        imageUrl: imageUrl || null,
        bio: bio || null,
        linkedinUrl: linkedinUrl || null,
        otherLinks: otherLinks || [],
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : 0,
        sprintMentorId: sprintMentorId || null,
      })
      .where(eq(sprintSessionMentors.id, mentorId))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating sprint session mentor:", error);
    return NextResponse.json(
      { error: "Failed to update session mentor" },
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

    const { id: mentorId } = await params;

    await db
      .delete(sprintSessionMentors)
      .where(eq(sprintSessionMentors.id, mentorId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sprint session mentor:", error);
    return NextResponse.json(
      { error: "Failed to delete session mentor" },
      { status: 500 }
    );
  }
}
