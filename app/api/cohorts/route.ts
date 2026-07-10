import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohorts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const activeCohorts = await db
      .select()
      .from(cohorts)
      .where(eq(cohorts.isActive, true))
      .orderBy(cohorts.createdAt);

    return NextResponse.json(activeCohorts);
  } catch (error) {
    console.error("Error fetching cohorts:", error);
    return NextResponse.json(
      { error: "Failed to fetch cohorts" },
      { status: 500 }
    );
  }
}
