// app/api/bookmarks/route.ts
import { db } from "@/lib/db";
import { bookmarks, opportunities } from "@/lib/schema";
import { getSessionCached } from "@/lib/auth-session-cache";
import { createApiTimer } from "@/lib/api-timing";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const timer = createApiTimer("POST /api/bookmarks");

  try {
    const { userId, opportunityId } = await req.json();

    // Check if bookmark already exists
    timer.mark("exists_check_start");
    const existingBookmark = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.opportunityId, opportunityId)
        )
      )
      .limit(1);
    timer.mark("exists_check_done", { rows: existingBookmark.length });

    if (existingBookmark.length > 0) {
      // Bookmark already exists, return success
      timer.end({ status: 200, alreadyBookmarked: true });
      return NextResponse.json({
        success: true,
        message: "Already bookmarked",
      });
    }

    // Create new bookmark
    timer.mark("insert_start");
    await db.insert(bookmarks).values({
      userId,
      opportunityId,
    });
    timer.mark("insert_done");

    timer.end({ status: 200, alreadyBookmarked: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const timer = createApiTimer("DELETE /api/bookmarks");

  try {
    const { userId, opportunityId } = await req.json();

    timer.mark("delete_start");
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.opportunityId, opportunityId)
        )
      );
    timer.mark("delete_done");

    timer.end({ status: 200 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const timer = createApiTimer("GET /api/bookmarks");

  try {
    // Get user ID from auth session
    timer.mark("auth_start");
    const session = await getSessionCached(await headers());
    timer.mark("auth_done", { hasSession: Boolean(session?.user?.id) });

    if (!session?.user?.id) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2025-09"

    if (month) {
      // validate month query param (expected "YYYY-MM")
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        timer.end({ status: 400, reason: "invalid_month" });
        return NextResponse.json(
          { error: "Invalid month format. Expected YYYY-MM" },
          { status: 400 }
        );
      }

      const [year, mon] = month.split("-");
      const yearNum = Number(year);
      const monNum = Number(mon);

      // start = first day of month (YYYY-MM-DD)
      const startDate = new Date(yearNum, monNum - 1, 1, 0, 0, 0, 0);
      // end = last day of month
      const endDate = new Date(yearNum, monNum, 0, 23, 59, 59, 999);

      // convert to YYYY-MM-DD strings because `opportunities.endDate` is a DATE column
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      // fetch only dates for this user within the month range
      timer.mark("month_query_start");
      const dates = await db
        .select({
          endDate: opportunities.endDate,
        })
        .from(bookmarks)
        .innerJoin(opportunities, eq(bookmarks.opportunityId, opportunities.id))
        .where(
          and(
            eq(bookmarks.userId, session.user.id),
            gte(opportunities.endDate, startStr),
            lte(opportunities.endDate, endStr)
          )
        )
        .orderBy(opportunities.endDate);
      timer.mark("month_query_done", { rows: dates.length });

      // return unique, sorted dates as strings (YYYY-MM-DD)
      const formatted = Array.from(
        new Set(dates.filter((d) => d.endDate).map((d) => d.endDate))
      ).sort();

      timer.end({ status: 200, mode: "month", uniqueDates: formatted.length });
      return NextResponse.json({ dates: formatted });
    }

    // Fetch user's bookmarks
    timer.mark("list_query_start");
    const data = await db
      .select({
        bookmarkId: bookmarks.id,
        opportunityId: opportunities.id,
        title: opportunities.title,
        type: opportunities.type,
        description: opportunities.description,
        endDate: opportunities.endDate,
        daysDiff: sql`DATE_PART('day', ${opportunities.endDate} - NOW())`,
      })
      .from(bookmarks)
      .innerJoin(opportunities, eq(bookmarks.opportunityId, opportunities.id))
      .where(eq(bookmarks.userId, session.user.id));
    timer.mark("list_query_done", { rows: data.length });

    // Separate into upcoming, closed and uncategorized (endDate IS NULL)
    const upcoming: any[] = [];
    const closed: any[] = [];
    const uncategorized: any[] = [];

    data.forEach((item: any) => {
      // Items without an endDate are uncategorized
      if (item.endDate == null) {
        uncategorized.push({
          title: item.title,
          description: item.description,
          type: item.type,
          endDate: null,
          daysDiff: null,
        });
        return;
      }

      // Prefer SQL-provided daysDiff, fallback to server-side calculation
      const rawDiff = Number(item.daysDiff);
      let daysDiff: number;
      if (Number.isFinite(rawDiff)) {
        daysDiff = Math.trunc(rawDiff);
      } else {
        const diffMs = new Date(item.endDate).getTime() - Date.now();
        daysDiff = Math.trunc(diffMs / (1000 * 60 * 60 * 24));
      }

      const payload = {
        title: item.title,
        description: item.description,
        type: item.type,
        endDate: item.endDate,
        daysDiff,
      };

      if (daysDiff >= 0) {
        upcoming.push(payload);
      } else {
        closed.push(payload);
      }
    });

    timer.end({
      status: 200,
      mode: "full",
      upcoming: upcoming.length,
      closed: closed.length,
      uncategorized: uncategorized.length,
    });
    return NextResponse.json({ upcoming, closed, uncategorized });
  } catch (error) {
    console.error(error);
    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
