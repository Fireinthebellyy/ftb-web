import { auth } from "@/lib/auth";
import { db, dbPool } from "@/lib/db";
import { ungatekeepPostVotes, ungatekeepPosts } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const voteBodySchema = z.object({
  direction: z.enum(["up", "down"]),
});

async function getVoteSummary(postId: string, userId: string | null) {
  const [row] = await db
    .select({
      score: sql<number>`COALESCE((SELECT SUM(vote)::int FROM "ungatekeep_post_votes" WHERE "post_id" = ${postId}), 0)`,
      userVote: userId
        ? sql<number>`COALESCE((SELECT vote FROM "ungatekeep_post_votes" WHERE "post_id" = ${postId} AND "user_id" = ${userId}), 0)`
        : sql<number>`0`,
    })
    .from(ungatekeepPosts)
    .where(eq(ungatekeepPosts.id, postId))
    .limit(1);

  return {
    score: Number(row?.score ?? 0),
    userVote: Number(row?.userVote ?? 0) as -1 | 0 | 1,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const postExists = await db
      .select({ id: ungatekeepPosts.id })
      .from(ungatekeepPosts)
      .where(
        and(eq(ungatekeepPosts.id, postId), eq(ungatekeepPosts.isPublished, true))
      )
      .limit(1);

    if (!postExists.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id ?? null;

    const summary = await getVoteSummary(postId, userId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET ungatekeep vote error:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = voteBodySchema.parse(await req.json());
    const nextVote = body.direction === "up" ? 1 : -1;

    const postExists = await db
      .select({ id: ungatekeepPosts.id })
      .from(ungatekeepPosts)
      .where(
        and(eq(ungatekeepPosts.id, postId), eq(ungatekeepPosts.isPublished, true))
      )
      .limit(1);

    if (!postExists.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await dbPool.transaction(async (tx) => {
      const existing = await tx
        .select({ id: ungatekeepPostVotes.id, vote: ungatekeepPostVotes.vote })
        .from(ungatekeepPostVotes)
        .where(
          and(
            eq(ungatekeepPostVotes.postId, postId),
            eq(ungatekeepPostVotes.userId, session.user.id)
          )
        )
        .for("update")
        .limit(1);

      if (existing.length === 0) {
        await tx.insert(ungatekeepPostVotes).values({
          postId,
          userId: session.user.id,
          vote: nextVote,
        });
      } else if (existing[0].vote === nextVote) {
        await tx
          .delete(ungatekeepPostVotes)
          .where(eq(ungatekeepPostVotes.id, existing[0].id));
      } else {
        await tx
          .update(ungatekeepPostVotes)
          .set({ vote: nextVote })
          .where(eq(ungatekeepPostVotes.id, existing[0].id));
      }
    });

    const summary = await getVoteSummary(postId, session.user.id);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST ungatekeep vote error:", error);
    return NextResponse.json(
      { error: "Failed to update vote" },
      { status: 500 }
    );
  }
}
