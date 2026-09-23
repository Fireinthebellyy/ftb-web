import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { toolkitMainStackedTestimonials } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const testimonialSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  orderIndex: z.number().default(0),
  isActive: z.boolean().default(true),
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

export async function GET() {
  const session = await checkAdmin();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testimonials = await db
    .select()
    .from(toolkitMainStackedTestimonials)
    .orderBy(asc(toolkitMainStackedTestimonials.orderIndex));

  return NextResponse.json(testimonials);
}

export async function POST(req: Request) {
  const session = await checkAdmin();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = testimonialSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [newTestimonial] = await db
    .insert(toolkitMainStackedTestimonials)
    .values({
      imageUrl: parsed.data.imageUrl,
      orderIndex: parsed.data.orderIndex,
      isActive: parsed.data.isActive,
    })
    .returning();

  return NextResponse.json(newTestimonial);
}