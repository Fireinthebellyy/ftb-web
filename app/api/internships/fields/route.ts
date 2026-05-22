import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const res = await db.execute(sql`
      SELECT DISTINCT field
      FROM internships
      WHERE deleted_at IS NULL AND is_active = true AND field IS NOT NULL AND field != ''
      ORDER BY field ASC
    `);

    const isRowWithField = (x: unknown): x is { field: unknown } =>
      typeof x === "object" && x !== null && "field" in x;

    const fieldList = res.rows
      .filter(isRowWithField)
      .map((r) => r.field)
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0);

    return NextResponse.json({ success: true, fields: fieldList });
  } catch (e) {
    console.error("GET /api/internships/fields error", e);
    return NextResponse.json(
      { error: "Failed to fetch internship fields" },
      { status: 500 }
    );
  }
}
