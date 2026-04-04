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
    const preferFeatured = featuredParam === "preferred";

    const baseFilters = and(
      isNull(opportunities.deletedAt),
      eq(opportunities.isActive, true),
      or(isNull(opportunities.publishAt), lte(opportunities.publishAt, new Date()))
    );

    const fetchRows = async (onlyFeatured: boolean) =>
      db
        .select({
          id: opportunities.id,
          title: opportunities.title,
        })
        .from(opportunities)
        .where(
          and(
            baseFilters,
            onlyFeatured ? eq(opportunities.isHomepageFeatured, true) : sql`true`
          )
        )
        .orderBy(
          onlyFeatured
            ? asc(sql`coalesce(${opportunities.homepageFeatureOrder}, 2147483647)`)
            : desc(opportunities.createdAt),
          desc(opportunities.createdAt)
        )
        .limit(validLimit)
        .offset(validOffset);

    const rows = preferFeatured
      ? await fetchRows(true)
      : await fetchRows(featuredOnly);

    const resolvedRows =
      preferFeatured && rows.length === 0 ? await fetchRows(false) : rows;

    return NextResponse.json({ opportunities: resolvedRows }, { status: 200 });
  } catch (error) {
    console.error("Error fetching public opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
