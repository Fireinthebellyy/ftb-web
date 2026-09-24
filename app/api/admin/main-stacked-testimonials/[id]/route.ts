import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { toolkitMainStackedTestimonials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const updateSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required").optional(),
  orderIndex: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    return null;
  }

  return session;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid testimonial ID" },
      { status: 400 }
    );
  }

  let json: unknown;

  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updatedTestimonial] = await db
    .update(toolkitMainStackedTestimonials)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(toolkitMainStackedTestimonials.id, id))
    .returning();

  if (!updatedTestimonial) {
    return NextResponse.json(
      { error: "Testimonial not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(updatedTestimonial);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid testimonial ID" },
      { status: 400 }
    );
  }

  const [deletedTestimonial] = await db
      .delete(toolkitMainStackedTestimonials)
      .where(eq(toolkitMainStackedTestimonials.id, id))
      .returning();

    if (!deletedTestimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

  return NextResponse.json(deletedTestimonial);
}