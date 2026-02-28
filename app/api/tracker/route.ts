import { db } from "@/lib/db";
import { trackerItems, trackerEvents } from "@/lib/schema";
import { getSessionCached } from "@/lib/auth-session-cache";
import { createApiTimer } from "@/lib/api-timing";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const trackerItemSchema = z.object({
  oppId: z.string().or(z.number().transform(String)),
  status: z.string(),
  kind: z.enum(["internship", "opportunity"]).default("internship"),
  notes: z.string().optional().nullable(),
  addedAt: z.string().optional(),
  appliedAt: z.string().nullable().optional(),
  result: z.string().nullable().optional(),
  isManual: z.boolean().optional(),
  manualData: z.unknown().optional(), // Safer than z.any(), requires checking before use
});

const trackerEventSchema = z.object({
  title: z.string(),
  date: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

// Patch Schema for validation
const patchSchema = z.object({
  action: z.enum(["update_status"]),
  id: z.string().or(z.number()),
  kind: z.enum(["internship", "opportunity"]).default("internship"),
  data: z.object({
    status: z.string(),
    extraData: z.record(z.unknown()).optional(),
  }),
});

export async function GET() {
  const timer = createApiTimer("GET /api/tracker");

  try {
    if (!db) {
      timer.end({ status: 500, reason: "missing_db" });
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 500 }
      );
    }

    const session = await getSessionCached(await headers());
    if (!session?.user?.id) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    timer.mark("fetch_start");

    // Fetch items and events in parallel
    const [items, events] = await Promise.all([
      db
        .select()
        .from(trackerItems)
        .where(eq(trackerItems.userId, session.user.id)),
      db
        .select()
        .from(trackerEvents)
        .where(eq(trackerEvents.userId, session.user.id))
        .orderBy(desc(trackerEvents.date)),
    ]);

    timer.mark("fetch_done");

    // Process items to parse manualData safely
    const processedItems = items.map((item) => {
      let parsedManualData = null;
      if (item.manualData) {
        try {
          parsedManualData = JSON.parse(item.manualData);
        } catch (e) {
          console.error(`Failed to parse manualData for item ${item.id}`, e);
          parsedManualData = null; // Fallback
        }
      }
      return {
        ...item,
        manualData: parsedManualData,
      };
    });

    timer.end({ status: 200 });
    return NextResponse.json({
      items: processedItems,
      events: events,
    });
  } catch (error) {
    console.error("Error fetching tracker data:", error);
    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!db)
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 500 }
      );

    const session = await getSessionCached(await headers());
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, data } = body; // action: 'add_item' | 'add_event' | 'sync_items' | 'sync_events'

    if (action === "add_item") {
      const validated = trackerItemSchema.parse(data);

      await db
        .insert(trackerItems)
        .values({
          userId: session.user.id,
          oppId: validated.oppId,
          kind: validated.kind,
          status: validated.status,
          notes: validated.notes,
          addedAt: validated.addedAt ? new Date(validated.addedAt) : undefined,
          appliedAt: validated.appliedAt ? new Date(validated.appliedAt) : null,
          result: validated.result,
          isManual: validated.isManual || false,
          manualData: validated.manualData
            ? JSON.stringify(validated.manualData)
            : null,
        })
        .onConflictDoUpdate({
          target: [trackerItems.userId, trackerItems.kind, trackerItems.oppId],
          set: {
            status: validated.status,
            updatedAt: new Date(),
          },
        });

      return NextResponse.json({ success: true });
    }

    if (action === "add_event") {
      const validated = trackerEventSchema.parse(data);

      const [newEvent] = await db
        .insert(trackerEvents)
        .values({
          userId: session.user.id,
          title: validated.title,
          date: new Date(validated.date),
          type: validated.type,
          description: validated.description,
        })
        .returning();

      return NextResponse.json({ success: true, event: newEvent });
    }

    if (action === "sync_items") {
      if (!Array.isArray(data))
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });

      if (data.length === 0) return NextResponse.json({ success: true });

      const MAX_SYNC_BATCH = 500;
      if (data.length > MAX_SYNC_BATCH) {
        return NextResponse.json({ error: "Too many items" }, { status: 413 });
      }

      const validItems = [];
      for (const item of data) {
        const parsed = trackerItemSchema.safeParse(item);
        if (parsed.success) {
          validItems.push({
            userId: session.user.id,
            oppId: parsed.data.oppId,
            kind: parsed.data.kind,
            status: parsed.data.status,
            notes: parsed.data.notes,
            addedAt: parsed.data.addedAt
              ? new Date(parsed.data.addedAt)
              : undefined,
            appliedAt: parsed.data.appliedAt
              ? new Date(parsed.data.appliedAt)
              : null,
            result: parsed.data.result,
            isManual: parsed.data.isManual || false,
            manualData: parsed.data.manualData
              ? JSON.stringify(parsed.data.manualData)
              : null,
          });
        }
      }

      if (validItems.length > 0) {
        await db.transaction(async (tx) => {
          await tx
            .insert(trackerItems)
            .values(validItems)
            .onConflictDoNothing();
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "sync_events") {
      if (!Array.isArray(data))
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });

      if (data.length === 0) return NextResponse.json({ success: true });

      const MAX_SYNC_BATCH = 500;
      if (data.length > MAX_SYNC_BATCH) {
        return NextResponse.json({ error: "Too many items" }, { status: 413 });
      }

      const validEvents = [];
      for (const event of data) {
        const parsed = trackerEventSchema.safeParse(event);
        if (parsed.success) {
          validEvents.push({
            userId: session.user.id,
            title: parsed.data.title,
            date: new Date(parsed.data.date),
            type: parsed.data.type,
            description: parsed.data.description,
          });
        }
      }

      if (validEvents.length > 0) {
        await db.transaction(async (tx) => {
          await tx
            .insert(trackerEvents)
            .values(validEvents)
            .onConflictDoNothing({
              target: [
                trackerEvents.userId,
                trackerEvents.title,
                trackerEvents.date,
              ], // Using the new unique index
            });
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/tracker:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!db)
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 500 }
      );

    const session = await getSessionCached(await headers());
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Validate request body
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error },
        { status: 400 }
      );
    }

    const { action, id, kind, data } = parsed.data;

    if (action === "update_status") {
      // Safe allowlist for extraData updates to prevent mass assignment
      const allowedExtraKeys = ["notes", "result", "manualData", "isManual"]; // Add specific keys as needed
      const sanitizedExtraData: Record<string, unknown> = {};

      if (data.extraData) {
        for (const key of allowedExtraKeys) {
          if (key in data.extraData) {
            sanitizedExtraData[key] = data.extraData[key];
          }
        }
      }

      // If manualData is being updated, stringify it
      if (
        sanitizedExtraData.manualData &&
        typeof sanitizedExtraData.manualData !== "string"
      ) {
        sanitizedExtraData.manualData = JSON.stringify(
          sanitizedExtraData.manualData
        );
      }

      await db
        .update(trackerItems)
        .set({
          status: data.status,
          appliedAt: data.status === "Applied" ? new Date() : undefined,
          updatedAt: new Date(),
          ...sanitizedExtraData,
        })
        .where(
          and(
            eq(trackerItems.userId, session.user.id),
            eq(trackerItems.kind, kind),
            eq(trackerItems.oppId, String(id))
          )
        );

      return NextResponse.json({ success: true });
    }

    // Unreachable due to validation but good for type safety
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in PATCH /api/tracker:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!db)
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 500 }
      );

    const session = await getSessionCached(await headers());
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'item' or 'event'
    const id = searchParams.get("id");
    const kind =
      searchParams.get("kind") === "opportunity" ? "opportunity" : "internship";

    if (!id || !type)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );

    if (type === "item") {
      await db
        .delete(trackerItems)
        .where(
          and(
            eq(trackerItems.userId, session.user.id),
            eq(trackerItems.kind, kind),
            eq(trackerItems.oppId, id)
          )
        );
    } else if (type === "event") {
      await db
        .delete(trackerEvents)
        .where(
          and(
            eq(trackerEvents.userId, session.user.id),
            eq(trackerEvents.id, id)
          )
        );
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/tracker:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
