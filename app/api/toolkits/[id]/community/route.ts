import { eq, and, inArray, asc, desc, count } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCached } from "@/lib/auth-session-cache";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import {
  toolkitCommunityPosts,
  toolkitCommunityResponses,
  toolkits,
  user,
  userToolkits,
  cohorts,
  cohortOrders,
} from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: toolkitId } = await params;

    const [toolkitRecord] = await db
      .select({ id: toolkits.id })
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!toolkitRecord) {
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    const session = await getSessionCached(await headers());

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [userRecord] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const isAdminPreview = canAccessAdminTab(userRecord?.role, "toolkits");

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

    let hasPurchased = !!purchase;

    if (!hasPurchased) {
      const cohortPurchase = await db
        .select({ id: cohorts.id })
        .from(cohorts)
        .innerJoin(cohortOrders, eq(cohortOrders.cohortId, cohorts.id))
        .where(
          and(
            eq(cohorts.toolkitId, toolkitId),
            eq(cohortOrders.userId, userId),
            eq(cohortOrders.status, "paid")
          )
        )
        .limit(1);
      if (cohortPurchase.length > 0) {
        hasPurchased = true;
      }
    }

    if (!hasPurchased && !isAdminPreview) {
      return NextResponse.json(
        { error: "You do not have access to this toolkit" },
        { status: 403 }
      );
    }

    const rawPosts = await db
      .select()
      .from(toolkitCommunityPosts)
      .where(eq(toolkitCommunityPosts.toolkitId, toolkitId))
      .orderBy(
        asc(toolkitCommunityPosts.orderIndex),
        desc(toolkitCommunityPosts.createdAt)
      );

    const visiblePosts = isAdminPreview
      ? rawPosts
      : rawPosts.filter((post) => post.isPublished);

    if (visiblePosts.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    const postIds = visiblePosts.map((p) => p.id);
    const userResponses = await db
      .select({
        postId: toolkitCommunityResponses.postId,
        selectedOptionIndex: toolkitCommunityResponses.selectedOptionIndex,
        textResponse: toolkitCommunityResponses.textResponse,
        attachmentUrl: toolkitCommunityResponses.attachmentUrl,
        attachmentName: toolkitCommunityResponses.attachmentName,
        attachmentType: toolkitCommunityResponses.attachmentType,
      })
      .from(toolkitCommunityResponses)
      .where(
        and(
          eq(toolkitCommunityResponses.userId, userId),
          inArray(toolkitCommunityResponses.postId, postIds)
        )
      );

    const userResponseMap = new Map(
      userResponses.map((r) => [r.postId, r])
    );

    const pollPostIds = visiblePosts
      .filter((p) => (p.type === "poll" || p.type === "mcq") && userResponseMap.has(p.id))
      .map((p) => p.id);

    const voteCountsMap = new Map<string, number[]>();

    if (pollPostIds.length > 0) {
      for (const pollPostId of pollPostIds) {
        const rows = await db
          .select({
            selectedOptionIndex: toolkitCommunityResponses.selectedOptionIndex,
            count: count(),
          })
          .from(toolkitCommunityResponses)
          .where(eq(toolkitCommunityResponses.postId, pollPostId))
          .groupBy(toolkitCommunityResponses.selectedOptionIndex);

        const post = visiblePosts.find((p) => p.id === pollPostId);
        const optionCount = (post?.options ?? []).length;
        const counts = new Array<number>(optionCount).fill(0);
        
        for (const row of rows) {
          if (row.selectedOptionIndex < optionCount) {
            counts[row.selectedOptionIndex] = Number(row.count);
          }
        }
        voteCountsMap.set(pollPostId, counts);
      }
    }

    const posts = visiblePosts.map((post) => {
      const userResponse = userResponseMap.get(post.id);
      const userSelectedIndex = userResponse?.selectedOptionIndex ?? null;
      let optionVoteCounts: number[] | undefined = undefined;
      let totalVotes: number | undefined = undefined;

      if ((post.type === "poll" || post.type === "mcq") && userSelectedIndex !== null) {
        optionVoteCounts = voteCountsMap.get(post.id);
        totalVotes = optionVoteCounts?.reduce((a, b) => a + b, 0);
      }

      return {
        ...post,
        userSelectedIndex,
        userTextResponse: userResponse?.textResponse ?? null,
        userAttachmentUrl: userResponse?.attachmentUrl ?? null,
        userAttachmentName: userResponse?.attachmentName ?? null,
        userAttachmentType: userResponse?.attachmentType ?? null,
        optionVoteCounts,
        totalVotes,
      };
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching toolkit community posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch toolkit community posts" },
      { status: 500 }
    );
  }
}
