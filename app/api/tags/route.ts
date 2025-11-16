import { db } from "@/lib/db";
import { tags } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const limitParam = searchParams.get("limit");
    
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 1000)
      : undefined;

    if (!q) {
      const baseQuery = db.select({ name: tags.name }).from(tags);
      const rows = limit ? await baseQuery.limit(limit) : await baseQuery;
      return NextResponse.json({ success: true, tags: rows.map((r) => r.name) });
    }

    const baseQuery = db
      .select({ name: tags.name })
      .from(tags)
      .where(ilike(tags.name, `%${q}%`));
    
    const rows = limit ? await baseQuery.limit(limit) : await baseQuery;
    return NextResponse.json({ success: true, tags: rows.map((r) => r.name) });
  } catch (e) {
    console.error("GET /api/tags error", e);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}


