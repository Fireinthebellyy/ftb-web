import { db } from "@/lib/db";
import { comments, user } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

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

    const { id: opportunityId } = await params;

    // Fetch comments with user information, ordered by newest first
    const commentsWithUsers = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: comments.userId,
        opportunityId: comments.opportunityId,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .where(eq(comments.opportunityId, opportunityId))
      .orderBy(desc(comments.createdAt));

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

    const { id: opportunityId } = await params;
    const body = await req.json();
    const validatedData = commentSchema.parse(body);

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
      .insert(comments)
      .values({
        content: sanitizedContent,
        userId: currentUser.currentUser.id,
        opportunityId: opportunityId,
      })
      .returning({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: comments.userId,
        opportunityId: comments.opportunityId,
      });

    // Fetch the comment with user information
    const commentWithUser = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: comments.userId,
        opportunityId: comments.opportunityId,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .where(eq(comments.id, newComment.id))
      .limit(1);

    return NextResponse.json({ 
      comment: commentWithUser[0],
      message: "Comment posted successfully" 
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid comment data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
