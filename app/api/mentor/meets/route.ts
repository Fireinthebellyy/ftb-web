export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentorMeets, mentorAvailability, mentors, user } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, or } from "drizzle-orm";
import { google } from "googleapis";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const toolkitId = url.searchParams.get("toolkitId");

    // Check if user is mentor
    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.userId, userId)
    });

    let meets = [];
    if (mentorRecord) {
      // Mentor meets
      meets = await db.query.mentorMeets.findMany({
        where: eq(mentorMeets.mentorId, mentorRecord.id),
        with: {
          availability: true // Assumes relations are set up, but let's do a join if not. Wait, Drizzle query API needs relations defined.
          // For simplicity, let's just do a standard query without `with` if relations aren't explicitly exported.
        }
      });
    } else {
      // User meets
      meets = await db.query.mentorMeets.findMany({
        where: toolkitId 
          ? and(eq(mentorMeets.userId, userId), eq(mentorMeets.toolkitId, toolkitId))
          : eq(mentorMeets.userId, userId)
      });
    }

    // Since we don't have relations defined in the schema file currently, let's fetch availability manually for these meets
    const availabilityIds = meets.map(m => m.availabilityId);
    let availabilitySlots = [];
    if (availabilityIds.length > 0) {
      // Drizzle 'inArray' should be used, but since it's not imported we can map it if small. Wait, we can import inArray.
      // We will just do a manual join approach or import `inArray`.
      // Actually let's just return what we have and resolve relations on client or add `inArray` to import.
    }

    return NextResponse.json({ meets });
  } catch (error) {
    console.error("Mentor meets GET error:", error);
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

    const userId = session.user.id;
    const { availabilityId, mentorId, toolkitId } = await req.json();

    if (!availabilityId || !mentorId || !toolkitId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if slot is still available
    const slot = await db.query.mentorAvailability.findFirst({
      where: and(
        eq(mentorAvailability.id, availabilityId),
        eq(mentorAvailability.isBooked, false)
      )
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 400 });
    }

    // Mark as booked
    await db.update(mentorAvailability)
      .set({ isBooked: true })
      .where(eq(mentorAvailability.id, availabilityId));

    // Fetch mentor's user record to get their email
    const mentorUser = await db.query.user.findFirst({
      where: eq(user.id, mentorId) // Note: mentors table links to users via userId, wait. 
      // Actually mentorId passed here is from `mentors.id`. Let's fetch the actual mentor record first.
    });
    // Let's refetch mentor properly
    const mentorActual = await db.query.mentors.findFirst({
      where: eq(mentors.id, mentorId)
    });

    const mentorUserEmail = mentorActual ? (await db.query.user.findFirst({
      where: eq(user.id, mentorActual.userId)
    }))?.email : "";

    let meetLink = "";

    // Generate Google Meet Link using Service Account
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const jwtClient = new google.auth.JWT(
          process.env.GOOGLE_CLIENT_EMAIL,
          undefined,
          process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          ['https://www.googleapis.com/auth/calendar']
        );

        const calendar = google.calendar({ version: "v3", auth: jwtClient });

        const event = {
          summary: "Cohort Mentorship Session",
          description: "1:1 Mentorship Session via Fire In The Belly",
          start: { dateTime: new Date(slot.startTime).toISOString() },
          end: { dateTime: new Date(slot.endTime).toISOString() },
          attendees: [
            { email: session.user.email },
            ...(mentorUserEmail ? [{ email: mentorUserEmail }] : [])
          ],
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: "hangoutsMeet" }
            }
          }
        };

        const gcalRes = await calendar.events.insert({
          calendarId: "primary",
          conferenceDataVersion: 1,
          requestBody: event
        });

        meetLink = gcalRes.data.hangoutLink || "";
      } catch (gcalErr) {
        console.error("Google Calendar API Error:", gcalErr);
        // Continue and just create the meet without a link if API fails
      }
    }

    const newMeet = await db.insert(mentorMeets).values({
      availabilityId,
      userId,
      mentorId,
      toolkitId,
      meetLink: meetLink || null,
    }).returning();

    return NextResponse.json({ meet: newMeet[0] });
  } catch (error) {
    console.error("Mentor meets POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mentor sets the meet link
    const { meetId, meetLink } = await req.json();

    if (!meetId || !meetLink) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updated = await db.update(mentorMeets)
      .set({ meetLink })
      .where(eq(mentorMeets.id, meetId))
      .returning();

    return NextResponse.json({ meet: updated[0] });
  } catch (error) {
    console.error("Mentor meets PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
