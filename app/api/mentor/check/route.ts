import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentors } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ isMentor: false });
    }

    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.userId, session.user.id),
    });

    return NextResponse.json({ isMentor: !!mentorRecord });
  } catch (error) {
    console.error("Mentor check error:", error);
    return NextResponse.json({ isMentor: false });
  }
}
