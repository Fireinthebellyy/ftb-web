import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { toolkitLastCohortPoster } from "@/lib/schema";

import { eq } from "drizzle-orm";

export async function GET() {
  const [poster] = await db
    .select()
    .from(toolkitLastCohortPoster)
    .where(eq(toolkitLastCohortPoster.isActive, true))
    .limit(1);

  return NextResponse.json(poster ?? null);
}