import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { ungatekeepPosts, user as userTable } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
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
  tag: z
    .enum([
      "announcement",
      "company_experience",
      "resources",
      "playbooks",
      "college_hacks",
      "interview",
      "ama_drops",
      "ftb_recommends",
    ])
    .optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  publishAt: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;

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

    const allPosts = await db
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
        isPublished: ungatekeepPosts.isPublished,
        publishedAt: ungatekeepPosts.publishedAt,
        createdAt: ungatekeepPosts.createdAt,
        updatedAt: ungatekeepPosts.updatedAt,
        userId: ungatekeepPosts.userId,
        creatorName: userTable.name,
      })
      .from(ungatekeepPosts)
      .leftJoin(userTable, eq(ungatekeepPosts.userId, userTable.id))
      .orderBy(desc(ungatekeepPosts.createdAt));

    activityStatus = 200;
    return NextResponse.json(allPosts);
  } catch (error) {
    activityError = error;
    console.error("Error fetching ungatekeep posts:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.ungatekeep.list",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "ungatekeep_post",
      error: activityError,
    });
  }
}

export async function POST(request: Request) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
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

    const body = await request.json();
    const validationResult = createPostSchema.safeParse(body);

    if (!validationResult.success) {
      activityStatus = 400;
      activityError = validationResult.error.errors;
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const newPost = await db
      .insert(ungatekeepPosts)
      .values({
        content: validatedData.content,
        attachments: validatedData.attachments || [],
        linkUrl: validatedData.linkUrl || undefined,
        linkTitle: validatedData.linkTitle || undefined,
        linkImage: validatedData.linkImage || undefined,
        videoUrl: validatedData.videoUrl || undefined,
        tag: validatedData.tag || undefined,
        isPinned: validatedData.isPinned || false,
        isPublished: validatedData.isPublished || false,
        publishedAt: validatedData.publishAt
          ? new Date(validatedData.publishAt)
          : validatedData.isPublished
            ? new Date()
            : undefined,
        userId: currentUser.currentUser.id,
      })
      .returning();

    activityAfterState = newPost[0];
    activityStatus = 201;
    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating ungatekeep post:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.ungatekeep.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "ungatekeep_post",
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
