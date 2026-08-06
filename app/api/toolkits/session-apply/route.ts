import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sessionApplications, toolkits } from "@/lib/schema";

import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { toolkitId, answers } = body;

    if (!toolkitId || typeof toolkitId !== "string") {
      return NextResponse.json(
        { error: "Toolkit ID is required and must be a string" },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Answers must be a valid object" },
        { status: 400 }
      );
    }

    const toolkit = await db.query.toolkits.findFirst({
      where: eq(toolkits.id, toolkitId),
    });

    if (!toolkit) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    const questions = toolkit.sessionQuestions || [];
    for (const q of questions) {
      if (q.required && !answers[q.id]) {
        return NextResponse.json(
          { error: `Missing required answer for: ${q.question}` },
          { status: 400 }
        );
      }
    }

    // Insert the application
    await db.insert(sessionApplications).values({
      userId: session.user.id,
      toolkitId,
      answers,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SESSION_APPLY_POST]", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
