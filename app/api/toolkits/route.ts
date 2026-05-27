import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { db } from "@/lib/db";
import { digitalProductSections, toolkits, user } from "@/lib/schema";
import { hasMeaningfulRichText, normalizeRichText } from "@/lib/rich-text";
import { getCurrentUser } from "@/server/users";
import { eq, desc, sql } from "drizzle-orm";

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
        is_trending: toolkits.is_trending,
        is_featured_home: toolkits.is_featured_home,
        trending_index: toolkits.trending_index,
        featured_home_index: toolkits.featured_home_index,
        isBundle: toolkits.isBundle,
        bundleItems: toolkits.bundleItems,
        isBestSeller: toolkits.isBestSeller,
        isLimitedSeats: toolkits.isLimitedSeats,
        digitalProductSectionId: toolkits.digitalProductSectionId,
        digitalProductSectionTitle: digitalProductSections.title,
      })
      .from(toolkits)
      .leftJoin(user, eq(toolkits.userId, user.id))
      .leftJoin(
        digitalProductSections,
        eq(toolkits.digitalProductSectionId, digitalProductSections.id)
      )
      .where(eq(toolkits.isActive, true))
      .orderBy(
        sql`CASE WHEN ${toolkits.isBundle} = true THEN 0 ELSE 1 END ASC`,
        sql`CASE WHEN ${toolkits.is_featured_home} = true THEN 0 ELSE 1 END ASC`,
        sql`COALESCE(${toolkits.featured_home_index}, 9999) ASC`,
        sql`COALESCE(${toolkits.trending_index}, 9999) ASC`,
        desc(toolkits.createdAt)
      )

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
      is_trending,
      isBundle,
      bundleItems,
      isBestSeller,
      isLimitedSeats,
      digitalProductSectionId,
    } = body;

    const missingFields: string[] = [];

    if (typeof title !== "string" || !title.trim()) {
      missingFields.push("title");
    }

    if (price === undefined || price === null) {
      missingFields.push("price");
    }

    if (
      !isBundle &&
      category !== "digital products" &&
      (typeof coverImageUrl !== "string" || !coverImageUrl.trim())
    ) {
      missingFields.push("coverImageUrl");
    }

    if (missingFields.length > 0) {
      return badRequest("Please provide all required toolkit fields.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: missingFields,
      });
    }

    // Normalize description — rich text editor may send empty HTML like <p><br></p>
    const normalizedDescription = typeof description === "string" ? normalizeRichText(description) : "";

    if (!isBundle && !hasMeaningfulRichText(normalizedDescription, 10)) {
      return badRequest("Description must be at least 10 characters.", {
        code: "INVALID_DESCRIPTION",
        fields: ["description"],
      });
    }

    const newToolkit = await db
      .insert(toolkits)
      .values({
        title: title.trim(),
        description: normalizedDescription || title.trim(), // fallback for bundles with no description
        price,
        originalPrice: originalPrice ?? null,
        coverImageUrl: coverImageUrl || null,
        bannerImageUrl: bannerImageUrl || null,
        videoUrl: videoUrl || null,
        contentUrl: contentUrl || null,
        category: category || null,
        highlights: highlights ?? null,
        testimonials: testimonials ?? null,
        totalDuration: totalDuration || null,
        lessonCount: lessonCount ?? 0,
        isActive: false,
        showSaleBadge: showSaleBadge ?? false,
        is_trending: is_trending ?? false,
        isBundle: isBundle ?? false,
        bundleItems: bundleItems ?? [],
        isBestSeller: isBestSeller ?? false,
        isLimitedSeats: isLimitedSeats ?? false,
        digitalProductSectionId: digitalProductSectionId || null,
        userId: user.currentUser.id,
      })
      .returning();

    return NextResponse.json(newToolkit[0], { status: 201 });
  } catch (error) {
    console.error("Error creating toolkit:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create toolkit", details: message },
      { status: 500 }
    );
  }
}
