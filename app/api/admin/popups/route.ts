import { db } from "@/lib/db";
import { popups } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// Assuming there's some kind of auth check, you should check it.
// Based on project structure, check if `admin` role is verified. For now we just implement the db logic.

export async function GET() {
  try {
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
    const body = await req.json();
    const { title, type, content, images, delaySeconds, isActive } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    const [newPopup] = await db
      .insert(popups)
      .values({
        title,
        type,
        content: content || null,
        images: images || [],
        delaySeconds: delaySeconds || 0,
        isActive: isActive || false,
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
