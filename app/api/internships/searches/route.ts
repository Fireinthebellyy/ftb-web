import { NextRequest, NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { internshipSearchTerms } from "@/lib/schema";

const payloadSchema = z.object({
  term: z.string().min(1).max(120),
});

const normalizeTerm = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { term } = payloadSchema.parse(body);
    const trimmed = term.trim();
    const normalized = normalizeTerm(trimmed);
    const now = new Date();

    await db
      .insert(internshipSearchTerms)
      .values({
        term: trimmed,
        normalizedTerm: normalized,
        searchCount: 1,
        lastSearchedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: internshipSearchTerms.normalizedTerm,
        set: {
          term: trimmed,
          searchCount: sql`${internshipSearchTerms.searchCount} + 1`,
          lastSearchedAt: now,
          updatedAt: now,
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error recording internship search term:", error);
    return NextResponse.json(
      { error: "Failed to record search term" },
      { status: 500 }
    );
  }
}

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
    const limit = Number.isNaN(limitParam)
      ? 8
      : Math.min(Math.max(limitParam, 1), 20);

    const results = await db
      .select({
        term: internshipSearchTerms.term,
        searchCount: internshipSearchTerms.searchCount,
        lastSearchedAt: internshipSearchTerms.lastSearchedAt,
      })
      .from(internshipSearchTerms)
      .orderBy(
        desc(internshipSearchTerms.searchCount),
        desc(internshipSearchTerms.lastSearchedAt)
      )
      .limit(limit);

    return NextResponse.json({
      terms: results.map((item) => item.term),
    });
  } catch (error) {
    console.error("Error fetching internship trending searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending searches" },
      { status: 500 }
    );
  }
}
