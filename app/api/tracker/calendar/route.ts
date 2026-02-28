import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/auth-session-cache";
import { db } from "@/lib/db";
import { account, trackerItems, user } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const createCalendarEventSchema = z.object({
  oppId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  deadline: z.string().min(1),
  kind: z.enum(["internship", "opportunity"]).default("internship"),
});

const calendarReminderSettingsSchema = z.object({
  weekBefore: z.boolean(),
  dayBefore: z.boolean(),
  hourBefore: z.boolean(),
});

interface GoogleCalendarEventSearchResponse {
  items?: Array<{ id?: string }>;
}

interface GoogleCalendarErrorResponse {
  error?: {
    message?: string;
  };
}

interface CalendarReminderSettings {
  weekBefore: boolean;
  dayBefore: boolean;
  hourBefore: boolean;
}

interface GoogleCalendarConnectionState {
  hasGoogleAccount: boolean;
  hasCalendarScope: boolean;
}

const GOOGLE_CALENDAR_SCOPES = new Set([
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/calendar.app.created",
]);

function parseDeadlineDate(deadline: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return deadline;
  }

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function getNextDate(dateText: string) {
  const current = new Date(`${dateText}T00:00:00.000Z`);
  current.setUTCDate(current.getUTCDate() + 1);
  return current.toISOString().slice(0, 10);
}

async function getUserReminderSettings(
  userId: string
): Promise<CalendarReminderSettings> {
  if (!db) {
    return {
      weekBefore: true,
      dayBefore: true,
      hourBefore: true,
    };
  }

  const [row] = await db
    .select({
      calendarReminderWeek: user.calendarReminderWeek,
      calendarReminderDay: user.calendarReminderDay,
      calendarReminderHour: user.calendarReminderHour,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    weekBefore: row?.calendarReminderWeek ?? true,
    dayBefore: row?.calendarReminderDay ?? true,
    hourBefore: row?.calendarReminderHour ?? true,
  };
}

async function getGoogleAccessToken(requestHeaders: Headers) {
  try {
    const tokenResponse = await auth.api.getAccessToken({
      body: {
        providerId: "google",
      },
      headers: requestHeaders,
    });

    return tokenResponse?.accessToken || null;
  } catch {
    return null;
  }
}

function hasAnyCalendarScope(scopeValue: string | null | undefined) {
  if (!scopeValue) {
    return false;
  }

  const normalizedScopes = scopeValue
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  return normalizedScopes.some((scope) => GOOGLE_CALENDAR_SCOPES.has(scope));
}

async function getGoogleCalendarConnectionState(
  userId: string
): Promise<GoogleCalendarConnectionState> {
  if (!db) {
    return {
      hasGoogleAccount: false,
      hasCalendarScope: false,
    };
  }

  const googleAccounts = await db
    .select({ scope: account.scope })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")));

  if (googleAccounts.length === 0) {
    return {
      hasGoogleAccount: false,
      hasCalendarScope: false,
    };
  }

  return {
    hasGoogleAccount: true,
    hasCalendarScope: googleAccounts.some((item) =>
      hasAnyCalendarScope(item.scope)
    ),
  };
}

export async function GET() {
  try {
    const requestHeaders = await headers();
    const session = await getSessionCached(requestHeaders);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [connectionState, reminders] = await Promise.all([
      getGoogleCalendarConnectionState(session.user.id),
      getUserReminderSettings(session.user.id),
    ]);

    return NextResponse.json({
      connected: connectionState.hasCalendarScope,
      reminders,
    });
  } catch (error) {
    console.error("Error loading calendar config:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 500 }
      );
    }

    const requestHeaders = await headers();
    const session = await getSessionCached(requestHeaders);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = calendarReminderSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await db
      .update(user)
      .set({
        calendarReminderWeek: parsed.data.weekBefore,
        calendarReminderDay: parsed.data.dayBefore,
        calendarReminderHour: parsed.data.hourBefore,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating calendar config:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const requestHeaders = await headers();
    const session = await getSessionCached(requestHeaders);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedBody = createCalendarEventSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const parsedDeadline = parseDeadlineDate(parsedBody.data.deadline);
    if (!parsedDeadline) {
      return NextResponse.json({ error: "Invalid deadline" }, { status: 400 });
    }

    const [connectionState, accessToken, reminderSettings] = await Promise.all([
      getGoogleCalendarConnectionState(session.user.id),
      getGoogleAccessToken(requestHeaders),
      getUserReminderSettings(session.user.id),
    ]);

    if (!connectionState.hasGoogleAccount) {
      return NextResponse.json(
        {
          error: "Google Calendar is not connected",
          code: "GOOGLE_CALENDAR_NOT_CONNECTED",
        },
        { status: 403 }
      );
    }

    if (!connectionState.hasCalendarScope) {
      return NextResponse.json(
        {
          error:
            "Google Calendar scope is missing. Please connect Google Calendar from tracker.",
          code: "GOOGLE_CALENDAR_SCOPE_MISSING",
        },
        { status: 403 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Google Calendar is not connected",
          code: "GOOGLE_CALENDAR_NOT_CONNECTED",
        },
        { status: 403 }
      );
    }

    const trackerKey = `${session.user.id}:${parsedBody.data.oppId}:${parsedDeadline}`;
    const trackerItemWhere = and(
      eq(trackerItems.userId, session.user.id),
      eq(trackerItems.oppId, parsedBody.data.oppId)
    );

    const duplicateSearchUrl = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    );
    duplicateSearchUrl.searchParams.set(
      "privateExtendedProperty",
      `ftbTrackerKey=${trackerKey}`
    );
    duplicateSearchUrl.searchParams.set("maxResults", "1");
    duplicateSearchUrl.searchParams.set("singleEvents", "true");

    const duplicateCheckResponse = await fetch(duplicateSearchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (duplicateCheckResponse.ok) {
      const existingEventData =
        (await duplicateCheckResponse.json()) as GoogleCalendarEventSearchResponse;
      if ((existingEventData.items || []).length > 0) {
        const existingEventId = existingEventData.items?.[0]?.id;
        if (db && existingEventId) {
          await db
            .update(trackerItems)
            .set({
              calendarEventId: existingEventId,
              calendarEventSyncedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(trackerItemWhere);
        }
        return NextResponse.json({ success: true, alreadyExists: true });
      }
    }

    const eventPayload = {
      summary: `FTB Deadline: ${parsedBody.data.title}`,
      description: `Company: ${parsedBody.data.company}\nType: ${parsedBody.data.kind}\nAdded from FTB tracker.`,
      start: {
        date: parsedDeadline,
      },
      end: {
        date: getNextDate(parsedDeadline),
      },
      extendedProperties: {
        private: {
          ftbTrackerKey: trackerKey,
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          ...(reminderSettings.weekBefore
            ? [{ method: "popup", minutes: 60 * 24 * 7 }]
            : []),
          ...(reminderSettings.dayBefore
            ? [{ method: "popup", minutes: 60 * 24 }]
            : []),
          ...(reminderSettings.hourBefore
            ? [{ method: "popup", minutes: 60 }]
            : []),
        ],
      },
    };

    const createResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!createResponse.ok) {
      const errorBody = (await createResponse
        .json()
        .catch(() => ({}))) as GoogleCalendarErrorResponse;

      if (createResponse.status === 403) {
        return NextResponse.json(
          {
            error:
              errorBody?.error?.message ||
              "Google Calendar scope is missing. Please reconnect Google Calendar.",
            code: "GOOGLE_CALENDAR_SCOPE_MISSING",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error:
            errorBody?.error?.message ||
            "Failed to create Google Calendar event",
        },
        { status: 502 }
      );
    }

    const createdEvent = await createResponse.json();
    if (db && createdEvent?.id) {
      await db
        .update(trackerItems)
        .set({
          calendarEventId: createdEvent.id,
          calendarEventSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(trackerItemWhere);
    }

    return NextResponse.json({
      success: true,
      eventId: createdEvent?.id,
      eventLink: createdEvent?.htmlLink,
    });
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
