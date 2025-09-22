import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedback as feedbackTable } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";

const payloadSchema = z.object({
  mood: z.number().min(1).max(5),
  meaning: z.string().min(1),
  message: z.string().max(1000).optional(),
  path: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Session is optional; do not fail if it throws
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      userId = session?.user?.id ?? null;
    } catch {
      userId = null;
    }

    const body = await req.json().catch(() => ({}));
    const data = payloadSchema.parse(body);

    const sanitizedMessage = data.message
      ?.trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "");

    await db.insert(feedbackTable).values({
      mood: data.mood,
      meaning: data.meaning,
      message: sanitizedMessage ?? null,
      path: data.path ?? null,
      userAgent: data.userAgent ?? req.headers.get("user-agent") ?? null,
      userId,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}


