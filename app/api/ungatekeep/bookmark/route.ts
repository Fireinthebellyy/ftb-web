import { NextResponse } from "next/server";
import { db, dbPool } from "@/lib/db";
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
        videoUrl: ungatekeepPosts.videoUrl,
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
      .where(
        and(
          eq(ungatekeepBookmarks.userId, userId),
          eq(ungatekeepPosts.isPublished, true)
        )
      )
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

import { z } from "zod";

const bookmarkSchema = z.object({
  postId: z.string().uuid(),
  bookmarked: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { postId, bookmarked } = bookmarkSchema.parse(body);

    // Validate that the post exists and is published
    const post = await db.query.ungatekeepPosts.findFirst({
      where: and(
        eq(ungatekeepPosts.id, postId),
        eq(ungatekeepPosts.isPublished, true)
      ),
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 400 });
    }

    await dbPool.transaction(async (tx) => {
      if (bookmarked) {
        await tx
          .insert(ungatekeepBookmarks)
          .values({ userId, postId })
          .onConflictDoNothing();
      } else {
        await tx
          .delete(ungatekeepBookmarks)
          .where(
            and(
              eq(ungatekeepBookmarks.userId, userId),
              eq(ungatekeepBookmarks.postId, postId)
            )
          );
      }
    });

    return NextResponse.json({ bookmarked });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}
