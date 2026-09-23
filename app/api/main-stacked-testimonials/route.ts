import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { toolkitMainStackedTestimonials } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const testimonials = await db
      .select()
      .from(toolkitMainStackedTestimonials)
      .where(eq(toolkitMainStackedTestimonials.isActive, true))
      .orderBy(asc(toolkitMainStackedTestimonials.orderIndex));

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching main stacked testimonials:", error);

    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}