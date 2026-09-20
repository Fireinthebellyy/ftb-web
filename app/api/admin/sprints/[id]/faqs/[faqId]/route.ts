import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintFaqs } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; faqId: string }> }
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

    const { id: sprintId, faqId } = await params;
    const body = await request.json();
    const { question, answer, imageUrl, orderIndex, isActive } = body;

    const existing = await db
      .select()
      .from(sprintFaqs)
      .where(and(eq(sprintFaqs.id, faqId), eq(sprintFaqs.sprintId, sprintId)))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const updated = await db
      .update(sprintFaqs)
      .set({
        ...(question !== undefined ? { question: String(question).trim() } : {}),
        ...(answer !== undefined ? { answer: answer ? String(answer).trim() : null } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl ? String(imageUrl).trim() : null } : {}),
        ...(orderIndex !== undefined ? { orderIndex: Number(orderIndex) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(sprintFaqs.id, faqId), eq(sprintFaqs.sprintId, sprintId)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating sprint FAQ:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; faqId: string }> }
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

    const { id: sprintId, faqId } = await params;

    await db
      .delete(sprintFaqs)
      .where(and(eq(sprintFaqs.id, faqId), eq(sprintFaqs.sprintId, sprintId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sprint FAQ:", error);
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
