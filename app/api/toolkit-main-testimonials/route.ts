import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkitMainTestimonials } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const testimonials = await db
      .select({
        id: toolkitMainTestimonials.id,
        imageUrl: toolkitMainTestimonials.imageUrl,
        orderIndex: toolkitMainTestimonials.orderIndex,
      })
      .from(toolkitMainTestimonials)
      .where(eq(toolkitMainTestimonials.isActive, true))
      .orderBy(asc(toolkitMainTestimonials.orderIndex));

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Failed to fetch toolkit main testimonials:", error);

    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}