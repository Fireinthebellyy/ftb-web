export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentorAvailability, mentors } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    let mentorId = url.searchParams.get("mentorId");

    if (!mentorId) {
      // If no mentorId provided, maybe the current user is a mentor
      const mentorRecord = await db.query.mentors.findFirst({
        where: eq(mentors.userId, session.user.id)
      });
      if (mentorRecord) {
        mentorId = mentorRecord.id;
      } else {
        return NextResponse.json({ error: "Mentor ID required" }, { status: 400 });
      }
    }

    // Get upcoming availability
    const slots = await db.query.mentorAvailability.findMany({
      where: eq(mentorAvailability.mentorId, mentorId),
      // We could filter by future dates here
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Mentor availability GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a mentor
    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.userId, session.user.id)
    });

    if (!mentorRecord) {
      return NextResponse.json({ error: "Forbidden: Not a mentor" }, { status: 403 });
    }

    const { startTime, endTime } = await req.json();

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 });
    }

    const newSlot = await db.insert(mentorAvailability).values({
      mentorId: mentorRecord.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    }).returning();

    return NextResponse.json({ slot: newSlot[0] });
  } catch (error) {
    console.error("Mentor availability POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
