export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentorMeets, mentorAvailability, mentors, user } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { google } from "googleapis";
import crypto from "crypto";

/** Build an OAuth2 client using the stored refresh token */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

// ─────────────────────────────────────────────
// GET — Fetch meets (enriched with slot times)
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const toolkitId = url.searchParams.get("toolkitId");

    // Check if the requesting user is a mentor
    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.userId, userId),
    });

    let meets: typeof mentorMeets.$inferSelect[] = [];

    if (mentorRecord) {
      meets = await db.query.mentorMeets.findMany({
        where: eq(mentorMeets.mentorId, mentorRecord.id),
      });
    } else {
      meets = await db.query.mentorMeets.findMany({
        where: toolkitId
          ? and(eq(mentorMeets.userId, userId), eq(mentorMeets.toolkitId, toolkitId))
          : eq(mentorMeets.userId, userId),
      });
    }

    // Enrich meets with slot times from mentorAvailability
    let enrichedMeets: any[] = meets;
    if (meets.length > 0) {
      const availabilityIds = meets.map((m) => m.availabilityId);
      const slots = await db.query.mentorAvailability.findMany({
        where: inArray(mentorAvailability.id, availabilityIds),
      });
      const slotsById = Object.fromEntries(slots.map((s) => [s.id, s]));
      enrichedMeets = meets.map((m) => ({
        ...m,
        slot: slotsById[m.availabilityId] ?? null,
      }));
    }

    // If mentor, also fetch student names for each meet
    if (mentorRecord && enrichedMeets.length > 0) {
      const userIds = [...new Set(enrichedMeets.map((m) => m.userId))];
      const users = await db.query.user.findMany({
        where: inArray(user.id, userIds),
        columns: { id: true, name: true, email: true, image: true },
      });
      const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
      enrichedMeets = enrichedMeets.map((m) => ({
        ...m,
        student: usersById[m.userId] ?? null,
      }));
    }

    return NextResponse.json({ meets: enrichedMeets });
  } catch (error) {
    console.error("Mentor meets GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// POST — Book a slot, create Google Meet link
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let isSlotUpdated = false;
  let createdEventId: string | null = null;
  let oAuthClientUsed: any = null;
  let slotIdToRevert: string | null = null;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { availabilityId, mentorId, toolkitId } = await req.json();

    if (!availabilityId || !mentorId || !toolkitId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Atomically mark slot as booked if it's available and belongs to the requested mentor
    const updatedSlots = await db
      .update(mentorAvailability)
      .set({ isBooked: true })
      .where(
        and(
          eq(mentorAvailability.id, availabilityId),
          eq(mentorAvailability.mentorId, mentorId),
          eq(mentorAvailability.isBooked, false)
        )
      )
      .returning();

    if (updatedSlots.length === 0) {
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 400 });
    }

    isSlotUpdated = true;
    slotIdToRevert = availabilityId;
    const slot = updatedSlots[0];

    // Fetch mentor details to get their email for the calendar invite
    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.id, mentorId),
    });
    const mentorUser = mentorRecord
      ? await db.query.user.findFirst({ where: eq(user.id, mentorRecord.userId) })
      : null;

    // ── Generate Google Meet link via Google Calendar API ──
    let meetLink: string | null = null;

    const oAuth2Client = getOAuth2Client();
    if (oAuth2Client) {
      try {
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

        const attendees = [{ email: session.user.email }];
        if (mentorUser?.email) attendees.push({ email: mentorUser.email });

        const event = {
          summary: `Cohort Mentorship Session — ${mentorRecord?.mentorName ?? "Mentor"}`,
          description: `1:1 mentorship session via Fire In The Belly. Mentor: ${mentorRecord?.mentorName ?? ""}`,
          start: {
            dateTime: new Date(slot.startTime).toISOString(),
            timeZone: "Asia/Kolkata",
          },
          end: {
            dateTime: new Date(slot.endTime).toISOString(),
            timeZone: "Asia/Kolkata",
          },
          attendees,
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 60 },
              { method: "popup", minutes: 10 },
            ],
          },
        };

        const gcalRes = await calendar.events.insert({
          calendarId: "primary",
          conferenceDataVersion: 1,
          sendUpdates: "all", // sends email invites to attendees
          requestBody: event,
        });

        createdEventId = gcalRes.data.id ?? null;
        oAuthClientUsed = oAuth2Client;
        meetLink = gcalRes.data.hangoutLink ?? null;
        console.log("Google Meet link created:", meetLink);
      } catch (gcalErr) {
        console.error("Google Calendar API Error:", gcalErr);
        // Graceful degradation: meet is still booked, just without a link
      }
    } else {
      console.warn("Google OAuth credentials not configured. Skipping Meet link generation.");
    }

    // Save the meet to the database
    const [newMeet] = await db
      .insert(mentorMeets)
      .values({
        availabilityId,
        userId,
        mentorId,
        toolkitId,
        meetLink,
      })
      .returning();

    return NextResponse.json({
      meet: {
        ...newMeet,
        slot,
      },
    });
  } catch (error) {
    console.error("Mentor meets POST error:", error);

    // Rollback changes on failure
    if (isSlotUpdated && slotIdToRevert) {
      try {
        console.log(`Reverting slot ${slotIdToRevert} to isBooked=false...`);
        await db
          .update(mentorAvailability)
          .set({ isBooked: false })
          .where(eq(mentorAvailability.id, slotIdToRevert));
      } catch (revertErr) {
        console.error("Failed to revert slot isBooked status:", revertErr);
      }
    }

    if (createdEventId && oAuthClientUsed) {
      try {
        console.log(`Deleting Google Calendar event ${createdEventId}...`);
        const calendar = google.calendar({ version: "v3", auth: oAuthClientUsed });
        await calendar.events.delete({
          calendarId: "primary",
          eventId: createdEventId,
          sendUpdates: "all",
        });
      } catch (gcalCancelErr) {
        console.error("Failed to delete Google Calendar event on failure:", gcalCancelErr);
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────
// PATCH — Mentor manually adds / updates a meet link
// ──────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the caller is a mentor
    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.userId, session.user.id),
    });
    if (!mentorRecord) {
      return NextResponse.json({ error: "Forbidden: Not a mentor" }, { status: 403 });
    }

    const { meetId, meetLink } = await req.json();
    if (!meetId || !meetLink) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [updated] = await db
      .update(mentorMeets)
      .set({ meetLink })
      .where(and(eq(mentorMeets.id, meetId), eq(mentorMeets.mentorId, mentorRecord.id)))
      .returning();

    return NextResponse.json({ meet: updated });
  } catch (error) {
    console.error("Mentor meets PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
