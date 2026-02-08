import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ungatekeepPosts, user as userTable } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  images: z.array(z.string()).optional(),
  linkUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkTitle: z.string().optional(),
  linkImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  tag: z.enum(["announcement", "company_experience", "resources"]).optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allPosts = await db
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

    return NextResponse.json(allPosts);
  } catch (error) {
    console.error("Error fetching ungatekeep posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createPostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const newPost = await db
      .insert(ungatekeepPosts)
      .values({
        title: validatedData.title,
        content: validatedData.content,
        images: validatedData.images || [],
        linkUrl: validatedData.linkUrl || undefined,
        linkTitle: validatedData.linkTitle || undefined,
        linkImage: validatedData.linkImage || undefined,
        tag: validatedData.tag || undefined,
        isPinned: validatedData.isPinned || false,
        isPublished: validatedData.isPublished || false,
        publishedAt: validatedData.isPublished ? new Date() : undefined,
        userId: currentUser.currentUser.id,
      })
      .returning();

    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error("Error creating ungatekeep post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
