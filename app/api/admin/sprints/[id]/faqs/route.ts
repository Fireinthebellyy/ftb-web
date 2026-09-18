import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintFaqs } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { eq, asc } from "drizzle-orm";

export async function GET(
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

    const { id: sprintId } = await params;

    const faqs = await db
      .select()
      .from(sprintFaqs)
      .where(eq(sprintFaqs.sprintId, sprintId))
      .orderBy(asc(sprintFaqs.orderIndex), asc(sprintFaqs.createdAt));

    return NextResponse.json(faqs);
  } catch (error) {
    console.error("Error fetching sprint FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { id: sprintId } = await params;
    const body = await request.json();
    const { question, answer, imageUrl, orderIndex, isActive } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const newFaq = await db
      .insert(sprintFaqs)
      .values({
        sprintId,
        question: question.trim(),
        answer: typeof answer === "string" ? answer.trim() : null,
        imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
        orderIndex: Number.isFinite(Number(orderIndex)) ? Number(orderIndex) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      })
      .returning();

    return NextResponse.json(newFaq[0]);
  } catch (error) {
    console.error("Error creating sprint FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}

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

    const { id: sprintId } = await params;
    const body = await request.json();
    const { faqs } = body;

    if (!Array.isArray(faqs)) {
      return NextResponse.json(
        { error: "faqs must be an array" },
        { status: 400 }
      );
    }

    for (let i = 0; i < faqs.length; i++) {
      const item = faqs[i];
      if (item.id) {
        await db
          .update(sprintFaqs)
          .set({
            orderIndex: i,
            ...(item.question !== undefined ? { question: item.question.trim() } : {}),
            ...(item.answer !== undefined ? { answer: item.answer?.trim() || null } : {}),
            ...(item.imageUrl !== undefined ? { imageUrl: item.imageUrl?.trim() || null } : {}),
            ...(item.isActive !== undefined ? { isActive: Boolean(item.isActive) } : {}),
            updatedAt: new Date(),
          })
          .where(eq(sprintFaqs.id, item.id));
      }
    }

    const updatedList = await db
      .select()
      .from(sprintFaqs)
      .where(eq(sprintFaqs.sprintId, sprintId))
      .orderBy(asc(sprintFaqs.orderIndex), asc(sprintFaqs.createdAt));

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("Error updating sprint FAQs list:", error);
    return NextResponse.json(
      { error: "Failed to update FAQs list" },
      { status: 500 }
    );
  }
}
