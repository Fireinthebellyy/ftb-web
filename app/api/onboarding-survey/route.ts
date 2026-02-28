import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboardingSurveyResponses } from "@/lib/schema";

const sourceValues = [
  "instagram",
  "reddit",
  "youtube",
  "linkedin",
  "chatgpt",
  "google_search",
  "whatsapp_group",
  "friend_or_senior",
  "campus_event",
  "other",
] as const;

const payloadSchema = z
  .object({
    source: z.enum(sourceValues),
    sourceOther: z.string().max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.source === "other") {
      if (!value.sourceOther || value.sourceOther.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceOther"],
          message: "Please tell us where you heard about us",
        });
      }
    }
  });

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [response] = await db
      .select({
        source: onboardingSurveyResponses.source,
        sourceOther: onboardingSurveyResponses.sourceOther,
      })
      .from(onboardingSurveyResponses)
      .where(eq(onboardingSurveyResponses.userId, session.user.id))
      .limit(1);

    return NextResponse.json({
      submitted: Boolean(response),
      response: response ?? null,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch survey status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = payloadSchema.parse(body);

    const normalizedOther =
      parsed.source === "other" && parsed.sourceOther
        ? parsed.sourceOther.trim().slice(0, 120)
        : null;

    const [response] = await db
      .insert(onboardingSurveyResponses)
      .values({
        userId: session.user.id,
        source: parsed.source,
        sourceOther: normalizedOther,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: onboardingSurveyResponses.userId,
        set: {
          source: parsed.source,
          sourceOther: normalizedOther,
          updatedAt: new Date(),
        },
      })
      .returning({
        source: onboardingSurveyResponses.source,
        sourceOther: onboardingSurveyResponses.sourceOther,
      });

    return NextResponse.json({ ok: true, response });
  } catch (error) {
    const err = error as Error & { name?: string };
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to submit survey" },
      { status: 500 }
    );
  }
}
