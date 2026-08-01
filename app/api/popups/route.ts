import { db } from "@/lib/db";
import { popups } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const activePopups = await db
      .select()
      .from(popups)
      .where(eq(popups.isActive, true))
      .orderBy(desc(popups.createdAt));

    return NextResponse.json({ popups: activePopups }, { status: 200 });
  } catch (error) {
    console.error("Error fetching popups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
