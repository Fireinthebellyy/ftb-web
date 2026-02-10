import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type BookmarkStatusResponse = {
  bookmarked: Record<string, boolean>;
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 200);

    if (!session?.user?.id || ids.length === 0) {
      return NextResponse.json<BookmarkStatusResponse>({ bookmarked: {} });
    }

    const rows = await db
      .select({ opportunityId: bookmarks.opportunityId })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.user.id),
          inArray(bookmarks.opportunityId, ids)
        )
      );

    const bookmarked = rows.reduce<Record<string, boolean>>((acc, row) => {
      acc[row.opportunityId] = true;
      return acc;
    }, {});

    return NextResponse.json<BookmarkStatusResponse>({ bookmarked });
  } catch (error) {
    console.error("Error fetching bookmark statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmark statuses" },
      { status: 500 }
    );
  }
}
