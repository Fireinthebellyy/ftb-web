import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkitTestimonialImages } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const images = await db
      .select()
      .from(toolkitTestimonialImages)
      .where(eq(toolkitTestimonialImages.isActive, true))
      .orderBy(asc(toolkitTestimonialImages.orderIndex));
    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching testimonial images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
