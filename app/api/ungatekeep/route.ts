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
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      isAuthenticated = !!session?.user;
      userId = session?.user?.id ?? null;
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
    const publishedPosts = await db
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
        // Add isSaved field if authenticated
        isSaved: userId 
          ? sql<boolean>`EXISTS(SELECT 1 FROM "ungatekeep_bookmarks" WHERE "post_id" = ${ungatekeepPosts.id} AND "user_id" = ${userId})`
          : sql<boolean>`false`,
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
