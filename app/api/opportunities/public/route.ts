import { db } from "@/lib/db";
import { opportunities } from "@/lib/schema";
import { and, asc, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
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
    const featuredParam = searchParams.get("featured");

    const validLimit = Math.min(
      Math.max(Number.isNaN(limitParam) ? 8 : limitParam, 1),
      50
    );
    const validOffset = Math.max(
      Number.isNaN(offsetParam) ? 0 : offsetParam,
      0
    );
    const featuredOnly = featuredParam === "true";

    const rows = await db
      .select({
        id: opportunities.id,
        title: opportunities.title,
      })
      .from(opportunities)
      .where(
        and(
          isNull(opportunities.deletedAt),
          eq(opportunities.isActive, true),
          featuredOnly
            ? eq(opportunities.isHomepageFeatured, true)
            : sql`true`,
          or(
            isNull(opportunities.publishAt),
            lte(opportunities.publishAt, new Date())
          )
        )
      )
      .orderBy(
        featuredOnly
          ? asc(sql`coalesce(${opportunities.homepageFeatureOrder}, 2147483647)`)
          : desc(opportunities.createdAt),
        desc(opportunities.createdAt)
      )
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
