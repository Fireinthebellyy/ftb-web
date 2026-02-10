import { getSessionCached } from "@/lib/auth-session-cache";
import { createApiTimer } from "@/lib/api-timing";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type BookmarkStatusResponse = {
  bookmarked: Record<string, boolean>;
};

export async function GET(req: NextRequest) {
  const timer = createApiTimer("GET /api/bookmarks/status");

  try {
    timer.mark("auth_start");
    const session = await getSessionCached(await headers());
    timer.mark("auth_done", { hasSession: Boolean(session?.user?.id) });

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 200);

    if (!session?.user?.id || ids.length === 0) {
      timer.end({ status: 200, ids: ids.length, rows: 0 });
      return NextResponse.json<BookmarkStatusResponse>({ bookmarked: {} });
    }

    timer.mark("query_start", { ids: ids.length });
    const rows = await db
      .select({ opportunityId: bookmarks.opportunityId })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.user.id),
          inArray(bookmarks.opportunityId, ids)
        )
      );
    timer.mark("query_done", { rows: rows.length });

    const bookmarked = rows.reduce<Record<string, boolean>>((acc, row) => {
      acc[row.opportunityId] = true;
      return acc;
    }, {});

    timer.end({ status: 200, ids: ids.length, rows: rows.length });
    return NextResponse.json<BookmarkStatusResponse>({ bookmarked });
  } catch (error) {
    console.error("Error fetching bookmark statuses:", error);
    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json(
      { error: "Failed to fetch bookmark statuses" },
      { status: 500 }
    );
  }
}
