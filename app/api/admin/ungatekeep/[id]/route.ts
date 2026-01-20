import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ungatekeepPosts } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  images: z.array(z.string()).optional(),
  linkUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkTitle: z.string().optional(),
  linkImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  tag: z.enum(["announcement", "company_experience", "resources"]).optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const postId = paramsResolved.id;

    const post = await db.query.ungatekeepPosts.findFirst({
      where: eq(ungatekeepPosts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching ungatekeep post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const postId = paramsResolved.id;

    const body = await request.json();
    const validationResult = updatePostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.title !== undefined) updates.title = validatedData.title;
    if (validatedData.content !== undefined)
      updates.content = validatedData.content;
    if (validatedData.images !== undefined) updates.images = validatedData.images;
    if (validatedData.linkUrl !== undefined)
      updates.linkUrl = validatedData.linkUrl || undefined;
    if (validatedData.linkTitle !== undefined)
      updates.linkTitle = validatedData.linkTitle || undefined;
    if (validatedData.linkImage !== undefined)
      updates.linkImage = validatedData.linkImage || undefined;
    if (validatedData.tag !== undefined) updates.tag = validatedData.tag;
    if (validatedData.isPinned !== undefined)
      updates.isPinned = validatedData.isPinned;
    if (validatedData.isPublished !== undefined) {
      updates.isPublished = validatedData.isPublished;
      // Set publishedAt when publishing for the first time
      if (validatedData.isPublished) {
        const existingPost = await db.query.ungatekeepPosts.findFirst({
          where: eq(ungatekeepPosts.id, postId),
          columns: { publishedAt: true },
        });
        if (!existingPost?.publishedAt) {
          updates.publishedAt = new Date();
        }
      }
    }

    const updatedPost = await db
      .update(ungatekeepPosts)
      .set(updates)
      .where(eq(ungatekeepPosts.id, postId))
      .returning();

    if (!updatedPost || updatedPost.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPost[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating ungatekeep post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const postId = paramsResolved.id;

    const deletedPost = await db
      .delete(ungatekeepPosts)
      .where(eq(ungatekeepPosts.id, postId))
      .returning();

    if (!deletedPost || deletedPost.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ungatekeep post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
