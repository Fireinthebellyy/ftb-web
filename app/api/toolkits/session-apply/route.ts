import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sessionApplications } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolkitId, answers } = await req.json();

    if (!toolkitId || !answers) {
      return NextResponse.json(
        { error: "Toolkit ID and answers are required" },
        { status: 400 }
      );
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
