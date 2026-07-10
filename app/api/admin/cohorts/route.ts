import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohorts } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allCohorts = await db
      .select()
      .from(cohorts)
      .orderBy(cohorts.createdAt);

    return NextResponse.json(allCohorts);
  } catch (error) {
    console.error("Error fetching admin cohorts:", error);
    return NextResponse.json(
      { error: "Failed to fetch cohorts" },
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
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, basePrice } = body;

    if (!title || !slug || basePrice === undefined) {
      return NextResponse.json(
        { error: "Title, slug, and base price are required" },
        { status: 400 }
      );
    }

    const newCohort = await db
      .insert(cohorts)
      .values({
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
        basePrice: Number(basePrice),
        badge1: "Summer 2026",
        badge2: "8 Weeks",
        subtitle: "A comprehensive cohort program.",
        isActive: true,
      })
      .returning();

    return NextResponse.json(newCohort[0]);
  } catch (error) {
    console.error("Error creating cohort:", error);
    return NextResponse.json(
      { error: "Failed to create cohort" },
      { status: 500 }
    );
  }
}
