import { db } from "@/lib/db";
import { popups } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/users";
import { z } from "zod";

const popupSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["text", "image"]),
  content: z.string().nullable().optional(),
  images: z.array(z.string().url()).optional().default([]),
  delaySeconds: z.number().min(0).optional().default(0),
  isActive: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id || currentUser.currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allPopups = await db
      .select()
      .from(popups)
      .orderBy(desc(popups.createdAt));

    return NextResponse.json({ popups: allPopups }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin popups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id || currentUser.currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = popupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error.issues }, { status: 400 });
    }
    const validatedData = parsed.data;

    if (validatedData.type === "image" && (!validatedData.images || validatedData.images.length === 0)) {
      return NextResponse.json({ error: "Image popups must have at least one image" }, { status: 400 });
    }

    const [newPopup] = await db
      .insert(popups)
      .values({
        title: validatedData.title,
        type: validatedData.type,
        content: validatedData.content || null,
        images: validatedData.images,
        delaySeconds: validatedData.delaySeconds,
        isActive: validatedData.isActive,
      })
      .returning();

    return NextResponse.json({ popup: newPopup }, { status: 201 });
  } catch (error) {
    console.error("Error creating popup:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
