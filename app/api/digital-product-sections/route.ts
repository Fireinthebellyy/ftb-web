import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { digitalProductSections } from "@/lib/schema";

export async function GET() {
  try {
    const sections = await db
      .select()
      .from(digitalProductSections)
      .where(eq(digitalProductSections.isActive, true))
      .orderBy(asc(digitalProductSections.orderIndex), asc(digitalProductSections.title));

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching digital product sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch digital product sections" },
      { status: 500 }
    );
  }
}
