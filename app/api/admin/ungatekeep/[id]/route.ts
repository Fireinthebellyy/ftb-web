import { NextResponse } from "next/server";
import { validationError } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { ungatekeepPosts } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updatePostSchema = z.object({
  content: z.string().min(1, "Content is required").optional(),
  attachments: z.array(z.string()).optional(),
  linkUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkTitle: z.string().optional(),
  linkImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  videoUrl: z
    .string()
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      "Invalid YouTube URL"
    )
    .optional()
    .or(z.literal("")),
  tag: z.string().optional(),
  toolkitId: z.string().uuid().optional().nullable(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  publishAt: z.string().optional().nullable(),
  is_trending: z.boolean().optional(),
  is_featured_home: z.boolean().optional(),
  trending_index: z.number().nullable().optional(),
  featured_home_index: z.number().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "ungatekeep")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const postId = paramsResolved.id;
    activityEntityId = postId;

    const post = await db.query.ungatekeepPosts.findFirst({
      where: eq(ungatekeepPosts.id, postId),
    });

    if (!post) {
      activityStatus = 404;
      activityError = "Post not found";
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    activityStatus = 200;
    return NextResponse.json(post);
  } catch (error) {
    activityError = error;
    console.error("Error fetching ungatekeep post:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.ungatekeep.get",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "ungatekeep_post",
      entityId: activityEntityId,
      error: activityError,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;
  let activityAfterState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "ungatekeep")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const postId = paramsResolved.id;
    activityEntityId = postId;

    const existingPost = await db.query.ungatekeepPosts.findFirst({
      where: eq(ungatekeepPosts.id, postId),
    });

    if (!existingPost) {
      activityStatus = 404;
      activityError = "Post not found";
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    activityBeforeState = existingPost;

    const body = await request.json();
    const validationResult = updatePostSchema.safeParse(body);

    if (!validationResult.success) {
      activityStatus = 400;
      activityError = validationResult.error.errors;
      return validationError(validationResult.error);
    }

    const validatedData = validationResult.data;

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.content !== undefined)
      updates.content = validatedData.content;
    if (validatedData.attachments !== undefined)
      updates.attachments = validatedData.attachments;
    if (validatedData.linkUrl !== undefined)
      updates.linkUrl = validatedData.linkUrl || undefined;
    if (validatedData.linkTitle !== undefined)
      updates.linkTitle = validatedData.linkTitle || undefined;
    if (validatedData.linkImage !== undefined)
      updates.linkImage = validatedData.linkImage || undefined;
    if (validatedData.videoUrl !== undefined)
      updates.videoUrl = validatedData.videoUrl || undefined;
    if (validatedData.tag !== undefined)
      updates.tag = validatedData.tag;
    if (validatedData.toolkitId !== undefined)
      updates.toolkitId = validatedData.toolkitId;
    if (validatedData.isPinned !== undefined)
      updates.isPinned = validatedData.isPinned;
    if (validatedData.publishAt !== undefined) {
      updates.publishedAt = validatedData.publishAt
        ? new Date(validatedData.publishAt)
        : null;
    }
    if (validatedData.isPublished !== undefined) {
      updates.isPublished = validatedData.isPublished;
      if (validatedData.isPublished && !validatedData.publishAt) {
        if (!existingPost?.publishedAt) {
          updates.publishedAt = new Date();
        }
      }
    }
    
    if (validatedData.is_trending !== undefined)
      updates.is_trending = validatedData.is_trending;
    if (validatedData.is_featured_home !== undefined)
      updates.is_featured_home = validatedData.is_featured_home;
    if (validatedData.trending_index !== undefined)
      updates.trending_index = validatedData.trending_index;
    if (validatedData.featured_home_index !== undefined)
      updates.featured_home_index = validatedData.featured_home_index;

    const updatedPost = await db
      .update(ungatekeepPosts)
      .set(updates)
      .where(eq(ungatekeepPosts.id, postId))
      .returning();

    if (!updatedPost || updatedPost.length === 0) {
      activityStatus = 404;
      activityError = "Post not found";
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    activityAfterState = updatedPost[0];
    activityStatus = 200;
    return NextResponse.json(updatedPost[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      activityStatus = 400;
      activityError = error.errors;
      return validationError(error);
    }

    activityError = error;
    console.error("Error updating ungatekeep post:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.ungatekeep.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "ungatekeep_post",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "ungatekeep")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const postId = paramsResolved.id;
    activityEntityId = postId;

    const existingPost = await db.query.ungatekeepPosts.findFirst({
      where: eq(ungatekeepPosts.id, postId),
    });

    if (!existingPost) {
      activityStatus = 404;
      activityError = "Post not found";
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    activityBeforeState = existingPost;

    const deletedPost = await db
      .delete(ungatekeepPosts)
      .where(eq(ungatekeepPosts.id, postId))
      .returning();

    if (!deletedPost || deletedPost.length === 0) {
      activityStatus = 404;
      activityError = "Post not found";
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting ungatekeep post:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.ungatekeep.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "ungatekeep_post",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}