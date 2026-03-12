import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ungatekeepPosts, user as userTable } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const postId = paramsResolved.id;

    // Check if user is authenticated
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      userId = session?.user?.id ?? null;
    } catch {
      // Not authenticated
    }

    // Fetch only if published
    const post = await db
      .select({
        id: ungatekeepPosts.id,
        content: ungatekeepPosts.content,
        attachments: ungatekeepPosts.attachments,
        linkUrl: ungatekeepPosts.linkUrl,
        linkTitle: ungatekeepPosts.linkTitle,
        linkImage: ungatekeepPosts.linkImage,
        tag: ungatekeepPosts.tag,
        isPinned: ungatekeepPosts.isPinned,
        publishedAt: ungatekeepPosts.publishedAt,
        createdAt: ungatekeepPosts.createdAt,
        creatorName: userTable.name,
        creatorImage: userTable.image,
        // Add isSaved field if authenticated
        isSaved: userId 
          ? sql<boolean>`EXISTS(SELECT 1 FROM "ungatekeep_bookmarks" WHERE "post_id" = ${ungatekeepPosts.id} AND "user_id" = ${userId})`
          : sql<boolean>`false`,
      })
      .from(ungatekeepPosts)
      .leftJoin(userTable, eq(ungatekeepPosts.userId, userTable.id))
      .where(
        and(
          eq(ungatekeepPosts.id, postId),
          eq(ungatekeepPosts.isPublished, true)
        )
      )
      .limit(1);

    if (!post || post.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post[0]);
  } catch (error) {
    console.error("Error fetching ungatekeep post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
