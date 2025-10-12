import { db } from "@/lib/db";
import { tags } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "8", 10) || 8, 1),
      50
    );

    if (!q) {
      const rows = await db.select({ name: tags.name }).from(tags).limit(limit);
      return NextResponse.json({ success: true, tags: rows.map((r) => r.name) });
    }

    const rows = await db
      .select({ name: tags.name })
      .from(tags)
      .where(ilike(tags.name, `%${q}%`))
      .limit(limit);

    return NextResponse.json({ success: true, tags: rows.map((r) => r.name) });
  } catch (e) {
    console.error("GET /api/tags error", e);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}


