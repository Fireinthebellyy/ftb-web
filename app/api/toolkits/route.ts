import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

// GET all toolkits
export async function GET() {
  try {
    const allToolkits = await db
      .select()
      .from(toolkits)
      .where(eq(toolkits.isActive, true));
    return NextResponse.json(allToolkits);
  } catch (error) {
    console.error("Error fetching toolkits:", error);
    return NextResponse.json(
      { error: "Failed to fetch toolkits" },
      { status: 500 }
    );
  }
}

// POST create new toolkit (Admin only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.currentUser?.id || user.currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, coverImageUrl, videoUrl, contentUrl } =
      body;

    if (!title || !description || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newToolkit = await db
      .insert(toolkits)
      .values({
        title,
        description,
        price,
        coverImageUrl,
        videoUrl,
        contentUrl,
        userId: user.currentUser.id,
      })
      .returning();

    return NextResponse.json(newToolkit[0], { status: 201 });
  } catch (error) {
    console.error("Error creating toolkit:", error);
    return NextResponse.json(
      { error: "Failed to create toolkit" },
      { status: 500 }
    );
  }
}
