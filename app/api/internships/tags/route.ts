import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  try {
    const res = await db.execute(sql`
      SELECT DISTINCT unnest(tags) as tag
      FROM internships
      WHERE deleted_at IS NULL AND is_active = true
      ORDER BY tag ASC
    `);
    
    const tagList = res.rows
      .map((r: any) => r.tag)
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0);

    return NextResponse.json({ success: true, tags: tagList });
  } catch (e) {
    console.error("GET /api/internships/tags error", e);
    return NextResponse.json(
      { error: "Failed to fetch internship tags" },
      { status: 500 }
    );
  }
}
