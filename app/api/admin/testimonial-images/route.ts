import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkitTestimonialImages } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const imageSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  orderIndex: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allImages = await db
      .select()
      .from(toolkitTestimonialImages)
      .orderBy(asc(toolkitTestimonialImages.orderIndex));
    return NextResponse.json(allImages);
  } catch (error) {
    console.error("Error fetching testimonial images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
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
    const parsed = imageSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const [newImage] = await db
      .insert(toolkitTestimonialImages)
      .values(parsed.data as any)
      .returning();

    return NextResponse.json(newImage);
  } catch (error) {
    console.error("Error creating testimonial image:", error);
    return NextResponse.json(
      { error: "Failed to create image" },
      { status: 500 }
    );
  }
}
