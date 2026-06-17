import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentorshipCarouselSlides } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const slideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  orderIndex: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json = await req.json();
    const parsed = slideSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const [updatedSlide] = await db
      .update(mentorshipCarouselSlides)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(mentorshipCarouselSlides.id, id))
      .returning();

    return NextResponse.json(updatedSlide);
  } catch (error) {
    console.error("Error updating slide:", error);
    return NextResponse.json(
      { error: "Failed to update slide" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(mentorshipCarouselSlides).where(eq(mentorshipCarouselSlides.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting slide:", error);
    return NextResponse.json(
      { error: "Failed to delete slide" },
      { status: 500 }
    );
  }
}
