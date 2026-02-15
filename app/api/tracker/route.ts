import { db } from "@/lib/db";
import { trackerItems, trackerEvents } from "@/lib/schema";
import { getSessionCached } from "@/lib/auth-session-cache";
import { createApiTimer } from "@/lib/api-timing";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for validating tracker items
const trackerItemSchema = z.object({
    oppId: z.string().or(z.number().transform(String)),
    status: z.string(),
    kind: z.enum(['internship', 'opportunity']).default('internship'),
    notes: z.string().optional().nullable(),
    addedAt: z.string().optional(),
    appliedAt: z.string().nullable().optional(),
    result: z.string().nullable().optional(),
    isManual: z.boolean().optional(),
    manualData: z.any().optional(), // Will be stringified
});

const trackerEventSchema = z.object({
    title: z.string(),
    date: z.string(),
    type: z.string(),
    description: z.string().optional(),
});

export async function GET() {
    const timer = createApiTimer("GET /api/tracker");

    try {
        if (!db) {
            timer.end({ status: 500, reason: "missing_db" });
            return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
        }

        const session = await getSessionCached(await headers());
        if (!session?.user?.id) {
            timer.end({ status: 401 });
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        timer.mark("fetch_start");

        // Fetch items and events in parallel
        const [items, events] = await Promise.all([
            db.select().from(trackerItems).where(eq(trackerItems.userId, session.user.id)),
            db.select().from(trackerEvents).where(eq(trackerEvents.userId, session.user.id)).orderBy(desc(trackerEvents.date))
        ]);

        timer.mark("fetch_done");

        // Process items to parse manualData if it exists
        const processedItems = items.map(item => ({
            ...item,
            manualData: item.manualData ? JSON.parse(item.manualData) : null
        }));

        timer.end({ status: 200 });
        return NextResponse.json({
            items: processedItems,
            events: events
        });

    } catch (error) {
        console.error("Error fetching tracker data:", error);
        timer.end({ status: 500, reason: "exception" });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

        const session = await getSessionCached(await headers());
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { action, data } = body; // action: 'add_item' | 'add_event' | 'sync_items' | 'sync_events'

        if (action === 'add_item') {
            const validated = trackerItemSchema.parse(data);

            await db.insert(trackerItems).values({
                userId: session.user.id,
                oppId: validated.oppId,
                kind: validated.kind,
                status: validated.status,
                notes: validated.notes,
                addedAt: validated.addedAt ? new Date(validated.addedAt) : undefined,
                appliedAt: validated.appliedAt ? new Date(validated.appliedAt) : null,
                result: validated.result,
                isManual: validated.isManual || false,
                manualData: validated.manualData ? JSON.stringify(validated.manualData) : null,
            }).onConflictDoUpdate({
                target: [trackerItems.userId, trackerItems.oppId],
                set: {
                    status: validated.status,
                    updatedAt: new Date(),
                }
            });

            return NextResponse.json({ success: true });
        }

        if (action === 'add_event') {
            const validated = trackerEventSchema.parse(data);

            const [newEvent] = await db.insert(trackerEvents).values({
                userId: session.user.id,
                title: validated.title,
                date: new Date(validated.date),
                type: validated.type,
                description: validated.description,
            }).returning();

            return NextResponse.json({ success: true, event: newEvent });
        }

        if (action === 'sync_items') {
            // Bulk insert/update from local storage migration
            if (!Array.isArray(data)) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

            for (const item of data) {
                try {
                    const validated = trackerItemSchema.parse(item);
                    await db.insert(trackerItems).values({
                        userId: session.user.id,
                        oppId: validated.oppId,
                        kind: validated.kind,
                        status: validated.status,
                        notes: validated.notes,
                        addedAt: validated.addedAt ? new Date(validated.addedAt) : undefined,
                        appliedAt: validated.appliedAt ? new Date(validated.appliedAt) : null,
                        result: validated.result,
                        isManual: validated.isManual || false,
                        manualData: validated.manualData ? JSON.stringify(validated.manualData) : null,
                    }).onConflictDoNothing(); // Don't overwrite if already exists during sync
                } catch (e) {
                    console.warn("Skipping invalid item during sync", e);
                }
            }
            return NextResponse.json({ success: true });
        }

        if (action === 'sync_events') {
            if (!Array.isArray(data)) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

            // For events, we might want to just insert them if they don't look like duplicates?
            // Implementing basic sync: just insert all
            for (const event of data) {
                try {
                    const validated = trackerEventSchema.parse(event);
                    await db.insert(trackerEvents).values({
                        userId: session.user.id,
                        title: validated.title,
                        date: new Date(validated.date),
                        type: validated.type,
                        description: validated.description,
                    });
                } catch (e) {
                    console.warn("Skipping invalid event during sync", e);
                }
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Error in POST /api/tracker:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

        const session = await getSessionCached(await headers());
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { action, id, data } = body;

        if (action === 'update_status') {
            await db.update(trackerItems)
                .set({
                    status: data.status,
                    appliedAt: data.status === 'Applied' ? new Date() : undefined, // Logic handled in frontend mostly, but good to have
                    updatedAt: new Date(),
                    ...data.extraData // Catch-all for other fields
                })
                .where(and(eq(trackerItems.userId, session.user.id), eq(trackerItems.oppId, String(id))));

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Error in PATCH /api/tracker:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

        const session = await getSessionCached(await headers());
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'item' or 'event'
        const id = searchParams.get('id');

        if (!id || !type) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

        if (type === 'item') {
            await db.delete(trackerItems)
                .where(and(eq(trackerItems.userId, session.user.id), eq(trackerItems.oppId, id)));
        } else if (type === 'event') {
            await db.delete(trackerEvents)
                .where(and(eq(trackerEvents.userId, session.user.id), eq(trackerEvents.id, id)));
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error in DELETE /api/tracker:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
