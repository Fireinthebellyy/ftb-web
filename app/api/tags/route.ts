import { db } from "@/lib/db";
import { tags } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { ilike } from "drizzle-orm";
import { unstable_cache } from "next/cache";

const TWENTY_FOUR_HOURS = 86400;

const getAllTags = unstable_cache(
  async (limit?: number) => {
    const baseQuery = db.select({ name: tags.name }).from(tags);
    const rows = limit ? await baseQuery.limit(limit) : await baseQuery;
    return rows.map((r) => r.name);
  },
  ["tags-all"],
  { revalidate: TWENTY_FOUR_HOURS }
);

const getFilteredTags = unstable_cache(
  async (q: string, limit?: number) => {
    const baseQuery = db
      .select({ name: tags.name })
      .from(tags)
      .where(ilike(tags.name, `%${q}%`));

    const rows = limit ? await baseQuery.limit(limit) : await baseQuery;
    return rows.map((r) => r.name);
  },
  ["tags-filtered"],
  { revalidate: TWENTY_FOUR_HOURS }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q") || "";
    const normalizedQ = rawQ.trim().toLowerCase();
    const limitParam = searchParams.get("limit");

    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 1000)
      : undefined;

    if (!normalizedQ) {
      const tagsList = await getAllTags(limit);
      return NextResponse.json({ success: true, tags: tagsList });
    }

    const tagsList = await getFilteredTags(normalizedQ, limit);
    return NextResponse.json({ success: true, tags: tagsList });
  } catch (e) {
    console.error("GET /api/tags error", e);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
