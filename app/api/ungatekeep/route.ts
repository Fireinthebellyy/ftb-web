import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ungatekeepPosts, user as userTable } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

const FREE_POST_LIMIT = 5;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

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

    // Fetch total count for metadata
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ungatekeepPosts)
      .where(eq(ungatekeepPosts.isPublished, true));
    
    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    // Fetch posts with pagination
    // Note: For non-authenticated users, we still respect the FREE_POST_LIMIT globally
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
      .orderBy(desc(ungatekeepPosts.publishedAt))
      .limit(isAuthenticated ? limit : FREE_POST_LIMIT)
      .offset(isAuthenticated ? offset : 0);

    return NextResponse.json({
      posts: publishedPosts,
      totalCount,
      isLimited: !isAuthenticated && totalCount > FREE_POST_LIMIT,
      hasMore: isAuthenticated ? offset + publishedPosts.length < totalCount : false,
    });
  } catch (error) {
    console.error("Error fetching published ungatekeep posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
