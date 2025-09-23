// app/api/bookmarks/route.ts
import { db } from "@/lib/db";
import { bookmarks, opportunities } from "@/lib/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const { userId, opportunityId } = await req.json();

    // Check if bookmark already exists
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

    if (existingBookmark.length > 0) {
      // Bookmark already exists, return success
      return NextResponse.json({
        success: true,
        message: "Already bookmarked",
      });
    }

    // Create new bookmark
    await db.insert(bookmarks).values({
      userId,
      opportunityId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId, opportunityId } = await req.json();

    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.opportunityId, opportunityId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get user ID from auth session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2025-09"

    if (month) {
      // validate month query param (expected "YYYY-MM")
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
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

      // return unique, sorted dates as strings (YYYY-MM-DD)
      const formatted = Array.from(
        new Set(dates.filter((d) => d.endDate).map((d) => d.endDate))
      ).sort();

      return NextResponse.json({ dates: formatted });
    }

    // Fetch user's bookmarks
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

    return NextResponse.json({ upcoming, closed, uncategorized });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
