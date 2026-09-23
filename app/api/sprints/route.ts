import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprints } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activeSprints = await db
      .select()
      .from(sprints)
      .where(eq(sprints.isActive, true))
      .orderBy(sprints.createdAt);

    return NextResponse.json(activeSprints);
  } catch (error) {
    console.error("Error fetching sprints:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprints" },
      { status: 500 }
    );
  }
}
