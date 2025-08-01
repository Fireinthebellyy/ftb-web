import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { opportunities } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/server/users";

// GET: returns { count, userHasUpvoted }
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const rows = await db
      .select({
        upvoterIds: opportunities.upvoterIds,
        upvoteCount: opportunities.upvoteCount,
      })
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const upvoteCount = rows[0].upvoteCount ?? 0;

    const auth = await getCurrentUser();
    const currentUserId = auth?.currentUser?.id as string | undefined;

    let userHasUpvoted = false;
    if (currentUserId && Array.isArray(rows[0].upvoterIds)) {
      userHasUpvoted = rows[0].upvoterIds.includes(currentUserId);
    }

    return NextResponse.json(
      { count: upvoteCount, userHasUpvoted },
      { status: 200 }
    );
  } catch (e) {
    console.error("GET upvote error:", e);
    return NextResponse.json(
      { error: "Failed to fetch upvotes" },
      { status: 500 }
    );
  }
}

// POST: toggles user upvote, returns { success, userHasUpvoted, count }
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const auth = await getCurrentUser();
    const currentUserId = auth?.currentUser?.id as string | undefined;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({
        upvoterIds: opportunities.upvoterIds,
      })
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = Array.isArray(rows[0].upvoterIds)
      ? rows[0].upvoterIds
      : [];
    const has = existing.includes(currentUserId);

    const nextUpvoters = has
      ? existing.filter((u) => u !== currentUserId)
      : [...existing, currentUserId];

    await db
      .update(opportunities)
      .set({
        upvoterIds: nextUpvoters,
        upvoteCount: nextUpvoters.length,
      })
      .where(eq(opportunities.id, id));

    return NextResponse.json(
      { success: true, userHasUpvoted: !has, count: nextUpvoters.length },
      { status: 200 }
    );
  } catch (e) {
    console.error("POST toggle upvote error:", e);
    return NextResponse.json(
      { error: "Failed to toggle upvote" },
      { status: 500 }
    );
  }
}
