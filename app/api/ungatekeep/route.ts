import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ungatekeepPosts, user as userTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

const FREE_POST_LIMIT = 5;

export async function GET() {
  try {
    // Check if user is authenticated
    let isAuthenticated = false;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      isAuthenticated = !!session?.user;
    } catch {
      // Not authenticated
    }

    // Fetch only published posts, ordered by pinned first, then by published date
    const publishedPosts = await db
      .select({
        id: ungatekeepPosts.id,
        title: ungatekeepPosts.title,
        content: ungatekeepPosts.content,
        images: ungatekeepPosts.images,
        linkUrl: ungatekeepPosts.linkUrl,
        linkTitle: ungatekeepPosts.linkTitle,
        linkImage: ungatekeepPosts.linkImage,
        tag: ungatekeepPosts.tag,
        isPinned: ungatekeepPosts.isPinned,
        publishedAt: ungatekeepPosts.publishedAt,
        createdAt: ungatekeepPosts.createdAt,
        creatorName: userTable.name,
      })
      .from(ungatekeepPosts)
      .leftJoin(userTable, eq(ungatekeepPosts.userId, userTable.id))
      .where(eq(ungatekeepPosts.isPublished, true))
      .orderBy(desc(ungatekeepPosts.isPinned), desc(ungatekeepPosts.publishedAt));

    // Limit posts for non-authenticated users
    const posts = isAuthenticated ? publishedPosts : publishedPosts.slice(0, FREE_POST_LIMIT);
    const totalCount = publishedPosts.length;

    return NextResponse.json({
      posts,
      totalCount,
      isLimited: !isAuthenticated && totalCount > FREE_POST_LIMIT,
    });
  } catch (error) {
    console.error("Error fetching published ungatekeep posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
