import { db } from "@/lib/db";
import {
  buildInternshipInsertValues,
  getIngestUserId,
  internshipIngestBatchSchema,
} from "@/lib/internships-ingest";
import { internships } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function getTokenFromRequest(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.trim();
  if (bearer?.toLowerCase().startsWith("bearer ")) {
    return bearer.slice(7).trim();
  }

  return (
    request.headers.get("x-ingest-token")?.trim() ||
    request.headers.get("x-api-key")?.trim() ||
    null
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const expectedToken = process.env.INTERNSHIP_INGEST_API_KEY;
    if (!expectedToken) {
      return NextResponse.json(
        { error: "INTERNSHIP_INGEST_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const incomingToken = getTokenFromRequest(req);
    if (!incomingToken || incomingToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const records = internshipIngestBatchSchema.parse(body);
    const ingestUserId = await getIngestUserId();
    const values = buildInternshipInsertValues(records, ingestUserId);

    const inserted = await db.insert(internships).values(values).returning();

    return NextResponse.json(
      {
        success: true,
        count: inserted.length,
        data: inserted,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error bulk ingesting internships:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
