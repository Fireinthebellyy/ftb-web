import { db } from "@/lib/db";
import {
  buildInternshipInsertValues,
  getIngestUserId,
  internshipIngestBatchSchema,
} from "@/lib/internships-ingest";
import { internships } from "@/lib/schema";
import { timingSafeEqual } from "crypto";
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

function isTokenMatch(expectedToken: string, incomingToken: string | null) {
  const expectedBuffer = Buffer.from(expectedToken, "utf8");
  const incomingBuffer = Buffer.from(incomingToken ?? "", "utf8");
  const maxLength = Math.max(expectedBuffer.length, incomingBuffer.length, 1);

  const expectedPadded = Buffer.alloc(maxLength);
  const incomingPadded = Buffer.alloc(maxLength);
  expectedBuffer.copy(expectedPadded);
  incomingBuffer.copy(incomingPadded);

  const valuesMatch = timingSafeEqual(expectedPadded, incomingPadded);
  return valuesMatch && expectedBuffer.length === incomingBuffer.length;
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
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const incomingToken = getTokenFromRequest(req);
    if (!isTokenMatch(expectedToken, incomingToken)) {
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
