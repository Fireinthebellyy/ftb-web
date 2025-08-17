import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/bookmarks/[id] -> { isBookmarked: boolean }
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, session.user.id), eq(bookmarks.opportunityId, id)))
      .limit(1);

    return NextResponse.json({ isBookmarked: rows.length > 0 }, { status: 200 });
  } catch (e) {
    console.error("GET bookmark status error:", e);
    return NextResponse.json(
      { error: "Failed to fetch bookmark status" },
      { status: 500 }
    );
  }
}


