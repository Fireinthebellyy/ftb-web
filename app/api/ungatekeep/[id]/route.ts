import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ungatekeepPosts, user as userTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const postId = paramsResolved.id;

    // Fetch only if published
    const post = await db
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
        creatorImage: userTable.image,
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
