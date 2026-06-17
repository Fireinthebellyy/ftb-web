import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentorshipCarouselSlides } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
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

export async function GET() {
  try {
    const allSlides = await db
      .select()
      .from(mentorshipCarouselSlides)
      .orderBy(asc(mentorshipCarouselSlides.orderIndex));
    return NextResponse.json(allSlides);
  } catch (error) {
    console.error("Error fetching slides:", error);
    return NextResponse.json(
      { error: "Failed to fetch slides" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = slideSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const [newSlide] = await db
      .insert(mentorshipCarouselSlides)
      .values(parsed.data as any)
      .returning();

    return NextResponse.json(newSlide);
  } catch (error) {
    console.error("Error creating slide:", error);
    return NextResponse.json(
      { error: "Failed to create slide" },
      { status: 500 }
    );
  }
}
