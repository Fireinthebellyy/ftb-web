import { and, eq, count } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCached } from "@/lib/auth-session-cache";
import { db } from "@/lib/db";
import {
  toolkitCommunityPosts,
  toolkitCommunityResponses,
  toolkits,
  userToolkits,
} from "@/lib/schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: toolkitId, postId } = await params;
    const body = await request.json();
    const selectedOptionIndex = Number(body.selectedOptionIndex);

    if (isNaN(selectedOptionIndex)) {
      return NextResponse.json(
        { error: "Invalid selected option index" },
        { status: 400 }
      );
    }

    const session = await getSessionCached(await headers());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [purchase] = await db
      .select({ id: userToolkits.id })
      .from(userToolkits)
      .where(
        and(
          eq(userToolkits.userId, userId),
          eq(userToolkits.toolkitId, toolkitId),
          eq(userToolkits.paymentStatus, "completed")
        )
      )
      .limit(1);

    if (!purchase) {
      return NextResponse.json(
        { error: "You do not have access to this toolkit" },
        { status: 403 }
      );
    }

    const [post] = await db
      .select()
      .from(toolkitCommunityPosts)
      .where(eq(toolkitCommunityPosts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.toolkitId.toLowerCase() !== toolkitId.toLowerCase()) {
      return NextResponse.json(
        { error: "Post does not belong to this toolkit" },
        { status: 400 }
      );
    }

    const options = post.options ?? [];
    if (selectedOptionIndex < 0 || selectedOptionIndex >= options.length) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    const [existingResponse] = await db
      .select({ id: toolkitCommunityResponses.id })
      .from(toolkitCommunityResponses)
      .where(
        and(
          eq(toolkitCommunityResponses.postId, postId),
          eq(toolkitCommunityResponses.userId, userId)
        )
      )
      .limit(1);

    if (existingResponse) {
      return NextResponse.json(
        { error: "You have already responded to this post" },
        { status: 409 }
      );
    }

    await db.insert(toolkitCommunityResponses).values({
      postId,
      userId,
      selectedOptionIndex,
    });

    let optionVoteCounts: number[] | undefined = undefined;
    let totalVotes: number | undefined = undefined;

    if (post.type === "poll" || post.type === "mcq") {
      const rows = await db
        .select({
          selectedOptionIndex: toolkitCommunityResponses.selectedOptionIndex,
          c: count(),
        })
        .from(toolkitCommunityResponses)
        .where(eq(toolkitCommunityResponses.postId, postId))
        .groupBy(toolkitCommunityResponses.selectedOptionIndex);

      const optionCount = options.length;
      optionVoteCounts = new Array<number>(optionCount).fill(0);
      for (const row of rows) {
        if (row.selectedOptionIndex < optionCount) {
          optionVoteCounts[row.selectedOptionIndex] = Number(row.c);
        }
      }
      totalVotes = optionVoteCounts.reduce((a, b) => a + b, 0);
    }

    return NextResponse.json({
      success: true,
      selectedOptionIndex,
      optionVoteCounts,
      totalVotes,
    });
  } catch (error) {
    console.error("Error responding to community post:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
