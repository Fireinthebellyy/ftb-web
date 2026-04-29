import { db } from "@/lib/db";
import { ungatekeepComments, ungatekeepPosts, user } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

const uuidSchema = z.string().uuid();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const { id: postId } = await params;

    // Validate UUID
    if (!uuidSchema.safeParse(postId).success) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 404 });
    }

    // Verify post exists
    const postExists = await db
      .select({ id: ungatekeepPosts.id })
      .from(ungatekeepPosts)
      .where(eq(ungatekeepPosts.id, postId))
      .limit(1);

    if (postExists.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch comments with user information, ordered by newest first
    const commentsWithUsers = await db
      .select({
        id: ungatekeepComments.id,
        content: ungatekeepComments.content,
        createdAt: ungatekeepComments.createdAt,
        updatedAt: ungatekeepComments.updatedAt,
        userId: ungatekeepComments.userId,
        postId: ungatekeepComments.postId,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(ungatekeepComments)
      .innerJoin(user, eq(ungatekeepComments.userId, user.id))
      .where(eq(ungatekeepComments.postId, postId))
      .orderBy(desc(ungatekeepComments.createdAt));

    return NextResponse.json({ comments: commentsWithUsers });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser?.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Validate UUID
    if (!uuidSchema.safeParse(postId).success) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 404 });
    }

    // Verify post exists
    const postExists = await db
      .select({ id: ungatekeepPosts.id })
      .from(ungatekeepPosts)
      .where(eq(ungatekeepPosts.id, postId))
      .limit(1);

    if (postExists.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let body;
    try {
      body = await req.json();
    } catch (_error) {
      return NextResponse.json(
        { error: "Malformed JSON" },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = commentSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0]?.message || "Invalid comment data" },
          { status: 400 }
        );
      }
      throw error;
    }

    // Sanitize the comment content (basic sanitization)
    const sanitizedContent = validatedData.content
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "");

    if (!sanitizedContent) {
      return NextResponse.json(
        { error: "Comment cannot be empty after sanitization" },
        { status: 400 }
      );
    }

    // Insert the comment
    const [newComment] = await db
      .insert(ungatekeepComments)
      .values({
        content: sanitizedContent,
        userId: currentUser.currentUser.id,
        postId: postId,
      })
      .returning({
        id: ungatekeepComments.id,
        content: ungatekeepComments.content,
        createdAt: ungatekeepComments.createdAt,
        updatedAt: ungatekeepComments.updatedAt,
        userId: ungatekeepComments.userId,
        postId: ungatekeepComments.postId,
      });

    // Fetch the comment with user information
    const commentWithUser = await db
      .select({
        id: ungatekeepComments.id,
        content: ungatekeepComments.content,
        createdAt: ungatekeepComments.createdAt,
        updatedAt: ungatekeepComments.updatedAt,
        userId: ungatekeepComments.userId,
        postId: ungatekeepComments.postId,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(ungatekeepComments)
      .innerJoin(user, eq(ungatekeepComments.userId, user.id))
      .where(eq(ungatekeepComments.id, newComment.id))
      .limit(1);

    return NextResponse.json({ 
      comment: commentWithUser[0],
      message: "Comment posted successfully" 
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
