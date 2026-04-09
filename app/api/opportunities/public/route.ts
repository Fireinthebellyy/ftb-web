import { db } from "@/lib/db";
import { opportunities } from "@/lib/schema";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);

    const validLimit = Math.min(
      Math.max(Number.isNaN(limitParam) ? 8 : limitParam, 1),
      50
    );
    const validOffset = Math.max(
      Number.isNaN(offsetParam) ? 0 : offsetParam,
      0
    );

    const rows = await db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        applyLink: opportunities.applyLink,
      })
      .from(opportunities)
      .where(
        and(
          isNull(opportunities.deletedAt),
          eq(opportunities.isActive, true),
          or(
            isNull(opportunities.publishAt),
            lte(opportunities.publishAt, new Date())
          )
        )
      )
      .orderBy(desc(opportunities.createdAt))
      .limit(validLimit)
      .offset(validOffset);

    return NextResponse.json({ opportunities: rows }, { status: 200 });
  } catch (error) {
    console.error("Error fetching public opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
