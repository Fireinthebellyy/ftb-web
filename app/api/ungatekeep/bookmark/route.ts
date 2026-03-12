import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ungatekeepBookmarks, ungatekeepPosts, user as userTable } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const savedPosts = await db
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
      })
      .from(ungatekeepBookmarks)
      .innerJoin(ungatekeepPosts, eq(ungatekeepBookmarks.postId, ungatekeepPosts.id))
      .leftJoin(userTable, eq(ungatekeepPosts.userId, userTable.id))
      .where(eq(ungatekeepBookmarks.userId, userId))
      .orderBy(desc(ungatekeepBookmarks.createdAt));

    return NextResponse.json(savedPosts);
  } catch (error) {
    console.error("Error fetching saved ungatekeep posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if already bookmarked
    const existing = await db
      .select()
      .from(ungatekeepBookmarks)
      .where(
        and(
          eq(ungatekeepBookmarks.userId, userId),
          eq(ungatekeepBookmarks.postId, postId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Unbookmark
      await db
        .delete(ungatekeepBookmarks)
        .where(
          and(
            eq(ungatekeepBookmarks.userId, userId),
            eq(ungatekeepBookmarks.postId, postId)
          )
        );
      return NextResponse.json({ bookmarked: false });
    } else {
      // Bookmark
      await db.insert(ungatekeepBookmarks).values({
        userId,
        postId,
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Error toggling ungatekeep bookmark:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}
