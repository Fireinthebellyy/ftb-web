// app/api/bookmarks/route.ts
import { db } from "@/lib/db";
import { bookmarks, opportunities } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";
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
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.opportunityId, opportunityId)))
      .limit(1);

    if (existingBookmark.length > 0) {
      // Bookmark already exists, return success
      return NextResponse.json({ success: true, message: "Already bookmarked" });
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
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.opportunityId, opportunityId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get user ID from auth session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      daysDiff: sql`DATE_PART('day', ${opportunities.endDate} - NOW())`
    })
    .from(bookmarks)
    .innerJoin(opportunities, eq(bookmarks.opportunityId, opportunities.id))
    .where(eq(bookmarks.userId, session.user.id));

  // Separate into future and past
  const future = [];
  const past = [];

  data.forEach(item => {
    const diff = Number(item.daysDiff);
    if (diff >= 0) {
      future.push({
        title: item.title,
        description: item.description,
        type: item.type,
        endDate: item.endDate,
        daysDiff: diff
      });
    } else {
      past.push({
        title: item.title,
        description: item.description,
        type: item.type,
        endDate: item.endDate,
        daysDiff: diff
      });
    }
  });

  return NextResponse.json({ future, past });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
