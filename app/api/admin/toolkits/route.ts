import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits, user as userTable } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allToolkits = await db
      .select({
        id: toolkits.id,
        title: toolkits.title,
        description: toolkits.description,
        price: toolkits.price,
        originalPrice: toolkits.originalPrice,
        coverImageUrl: toolkits.coverImageUrl,
        videoUrl: toolkits.videoUrl,
        contentUrl: toolkits.contentUrl,
        category: toolkits.category,
        highlights: toolkits.highlights,
        totalDuration: toolkits.totalDuration,
        lessonCount: toolkits.lessonCount,
        isActive: toolkits.isActive,
        createdAt: toolkits.createdAt,
        updatedAt: toolkits.updatedAt,
        userId: toolkits.userId,
        creatorName: userTable.name,
      })
      .from(toolkits)
      .leftJoin(userTable, eq(toolkits.userId, userTable.id))
      .orderBy(desc(toolkits.createdAt));

    return NextResponse.json(allToolkits);
  } catch (error) {
    console.error("Error fetching toolkits:", error);
    return NextResponse.json(
      { error: "Failed to fetch toolkits" },
      { status: 500 }
    );
  }
}
