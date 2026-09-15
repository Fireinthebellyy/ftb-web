import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprints } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";

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
    const { title, slug, basePrice, badge1, badge2, subtitle, isBestSeller, isFillingFast, isVerificationRequired } = body;

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
        ...(badge1 ? { badge1 } : {}),
        ...(badge2 ? { badge2 } : {}),
        ...(subtitle ? { subtitle } : {}),
        isActive: true,
        isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : false,
        isFillingFast: isFillingFast !== undefined ? Boolean(isFillingFast) : false,
        isVerificationRequired: isVerificationRequired !== undefined ? Boolean(isVerificationRequired) : true,
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
