import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentorshipCarouselSlides } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const activeSlides = await db
      .select()
      .from(mentorshipCarouselSlides)
      .where(eq(mentorshipCarouselSlides.isActive, true))
      .orderBy(asc(mentorshipCarouselSlides.orderIndex));
      
    return NextResponse.json(activeSlides);
  } catch (error) {
    console.error("Error fetching slides:", error);
    return NextResponse.json(
      { error: "Failed to fetch slides" },
      { status: 500 }
    );
  }
}
