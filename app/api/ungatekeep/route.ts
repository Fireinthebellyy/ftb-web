import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ungatekeepPosts, user as userTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
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

    return NextResponse.json(publishedPosts);
  } catch (error) {
    console.error("Error fetching published ungatekeep posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
