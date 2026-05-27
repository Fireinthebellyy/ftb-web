import { eq, and, asc, desc, count } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCached } from "@/lib/auth-session-cache";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import {
  toolkitCommunityPosts,
  toolkitCommunityResponses,
  user,
} from "@/lib/schema";

async function verifyAdmin() {
  const session = await getSessionCached(await headers());
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }
  const [userRecord] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!canAccessAdminTab(userRecord?.role, "toolkits")) {
    return { error: "Forbidden", status: 403 };
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminError = await verifyAdmin();
    if (adminError) {
      return NextResponse.json({ error: adminError.error }, { status: adminError.status });
    }

    const { id: toolkitId } = await params;

    const rawPosts = await db
      .select()
      .from(toolkitCommunityPosts)
      .where(eq(toolkitCommunityPosts.toolkitId, toolkitId))
      .orderBy(
        asc(toolkitCommunityPosts.orderIndex),
        desc(toolkitCommunityPosts.createdAt)
      );

    if (rawPosts.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    const pollPostIds = rawPosts
      .filter((p) => p.type === "poll" || p.type === "mcq")
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

        const post = rawPosts.find((p) => p.id === pollPostId);
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

    const posts = rawPosts.map((post) => {
      let optionVoteCounts: number[] | undefined = undefined;
      let totalVotes: number | undefined = undefined;

      if (post.type === "poll" || post.type === "mcq") {
        optionVoteCounts = voteCountsMap.get(post.id);
        totalVotes = optionVoteCounts?.reduce((a, b) => a + b, 0);
      }

      return {
        ...post,
        optionVoteCounts,
        totalVotes,
      };
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching admin community posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin community posts" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminError = await verifyAdmin();
    if (adminError) {
      return NextResponse.json({ error: adminError.error }, { status: adminError.status });
    }

    const { id: toolkitId } = await params;
    const body = await request.json();

    const {
      type,
      title,
      body: postBody,
      options,
      attachmentUrl,
      attachmentName,
      attachmentType,
      isPublished,
      orderIndex,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [newPost] = await db
      .insert(toolkitCommunityPosts)
      .values({
        toolkitId,
        type: type || "text",
        title,
        body: postBody,
        options: options || [],
        attachmentUrl,
        attachmentName,
        attachmentType,
        isPublished: isPublished ?? true,
        orderIndex: orderIndex || 0,
      })
      .returning();

    return NextResponse.json({ post: newPost });
  } catch (error) {
    console.error("Error creating community post:", error);
    return NextResponse.json(
      { error: "Failed to create community post" },
      { status: 500 }
    );
  }
}
