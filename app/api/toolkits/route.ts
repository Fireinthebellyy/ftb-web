import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { db } from "@/lib/db";
import { toolkits, user } from "@/lib/schema";
import { hasMeaningfulRichText, normalizeRichText } from "@/lib/rich-text";
import { getCurrentUser } from "@/server/users";
import { eq, desc } from "drizzle-orm";

// GET all toolkits
export async function GET() {
  try {
    const allToolkits = await db
      .select({
        id: toolkits.id,
        title: toolkits.title,
        description: toolkits.description,
        price: toolkits.price,
        originalPrice: toolkits.originalPrice,
        coverImageUrl: toolkits.coverImageUrl,
        bannerImageUrl: toolkits.bannerImageUrl,
        videoUrl: toolkits.videoUrl,
        contentUrl: toolkits.contentUrl,
        category: toolkits.category,
        highlights: toolkits.highlights,
        testimonials: toolkits.testimonials,
        totalDuration: toolkits.totalDuration,
        lessonCount: toolkits.lessonCount,
        isActive: toolkits.isActive,
        showSaleBadge: toolkits.showSaleBadge,
        createdAt: toolkits.createdAt,
        updatedAt: toolkits.updatedAt,
        userId: toolkits.userId,
        creatorName: user.name,
      })
      .from(toolkits)
      .leftJoin(user, eq(toolkits.userId, user.id))
      .where(eq(toolkits.isActive, true))
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

// POST create new toolkit (Admin only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.currentUser?.id || user.currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      originalPrice,
      coverImageUrl,
      bannerImageUrl,
      videoUrl,
      contentUrl,
      category,
      highlights,
      testimonials,
      totalDuration,
      lessonCount,
      showSaleBadge,
    } = body;

    const missingFields: string[] = [];

    if (typeof title !== "string" || !title.trim()) {
      missingFields.push("title");
    }

    if (typeof description !== "string" || !description.trim()) {
      missingFields.push("description");
    }

    if (price === undefined || price === null) {
      missingFields.push("price");
    }

    if (typeof coverImageUrl !== "string" || !coverImageUrl.trim()) {
      missingFields.push("coverImageUrl");
    }

    if (missingFields.length > 0) {
      return badRequest("Please provide all required toolkit fields.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: missingFields,
      });
    }

    if (!hasMeaningfulRichText(description, 10)) {
      return badRequest("Description must be at least 10 characters.", {
        code: "INVALID_DESCRIPTION",
        fields: ["description"],
      });
    }

    const newToolkit = await db
      .insert(toolkits)
      .values({
        title,
        description: normalizeRichText(description),
        price,
        originalPrice,
        coverImageUrl,
        bannerImageUrl,
        videoUrl,
        contentUrl,
        category,
        highlights,
        testimonials,
        totalDuration,
        lessonCount,
        isActive: false,
        showSaleBadge,
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
