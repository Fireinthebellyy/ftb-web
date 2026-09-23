import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprints } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSprints = await db
      .select()
      .from(sprints)
      .orderBy(sprints.createdAt);

    return NextResponse.json(allSprints);
  } catch (error) {
    console.error("Error fetching admin sprints:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprints" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      basePrice,
      originalPrice,
      badge1,
      badge2,
      innerSubtitle,
      outerSubtitle,
      coverImageUrl,
      coverImageUrls,
      cardImageUrl,
      startDate,
      highlights,
      mentorsHeading,
      mentorsLinkTarget,
      mentorsLimit,
      featuresHeading,
      sessionsHeading,
      testimonialsHeading,
      faqsHeading,
      whoIsThisForHeading,
      whoIsThisForBullets,
      investmentLabel,
      videoUrl,
      toolkitId,
      isActive,
      isBestSeller,
      isFillingFast,
      hasEarlyBird,
      isVerificationRequired,
      showEarlyBirdCheckout,
      showEarlyBirdMarqueeCheckout,
      showAddonsCheckout,
    } = body;

    if (!title || !slug || basePrice === undefined) {
      return NextResponse.json(
        { error: "Title, slug, and base price are required" },
        { status: 400 }
      );
    }

    const sanitizedSlug = String(slug)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "");
    if (!sanitizedSlug) {
      return NextResponse.json(
        { error: "Slug is invalid after sanitization" },
        { status: 400 }
      );
    }

    const parsedBasePrice = Number(basePrice);
    if (!Number.isFinite(parsedBasePrice) || parsedBasePrice < 0) {
      return NextResponse.json(
        { error: "basePrice must be a non-negative number" },
        { status: 400 }
      );
    }

    const newSprint = await db
      .insert(sprints)
      .values({
        title,
        slug: sanitizedSlug,
        basePrice: parsedBasePrice,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        badge1: badge1 || null,
        badge2: badge2 || null,
        innerSubtitle: innerSubtitle || null,
        outerSubtitle: outerSubtitle || null,
        coverImageUrl: coverImageUrl || null,
        coverImageUrls:
          coverImageUrls && Array.isArray(coverImageUrls)
            ? coverImageUrls.filter(
                (url: any) => typeof url === "string" && url.trim() !== ""
              )
            : null,
        cardImageUrl: cardImageUrl || null,
        startDate: startDate || null,
        highlights: highlights || null,
        mentorsHeading: mentorsHeading || "Meet Your Mentors",
        mentorsLinkTarget: mentorsLinkTarget || null,
        mentorsLimit: mentorsLimit ? Number(mentorsLimit) : 4,
        featuresHeading: featuresHeading || "What You Get",
        sessionsHeading: sessionsHeading || "Sprint Sessions & Curriculum",
        testimonialsHeading:
          testimonialsHeading || "What Members Say About Our Ecosystem",
        faqsHeading: faqsHeading || "Frequently Asked Questions",
        whoIsThisForHeading: whoIsThisForHeading || "Who Is This For?",
        whoIsThisForBullets:
          whoIsThisForBullets && Array.isArray(whoIsThisForBullets)
            ? whoIsThisForBullets.filter(
                (b: any) => typeof b === "string" && b.trim() !== ""
              )
            : null,
        investmentLabel: investmentLabel || "Total Investment",
        videoUrl: videoUrl ? videoUrl.trim() : null,
        toolkitId: toolkitId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : false,
        isFillingFast: isFillingFast !== undefined ? Boolean(isFillingFast) : false,
        hasEarlyBird: hasEarlyBird !== undefined ? Boolean(hasEarlyBird) : false,
        isVerificationRequired:
          isVerificationRequired !== undefined
            ? Boolean(isVerificationRequired)
            : true,
        showEarlyBirdCheckout: Boolean(showEarlyBirdCheckout ?? false),
        showEarlyBirdMarqueeCheckout: Boolean(
          showEarlyBirdMarqueeCheckout ?? false
        ),
        showAddonsCheckout: Boolean(showAddonsCheckout ?? true),
      })
      .returning();

    return NextResponse.json(newSprint[0]);
  } catch (error) {
    console.error("Error creating sprint:", error);
    return NextResponse.json(
      { error: "Failed to create sprint" },
      { status: 500 }
    );
  }
}
