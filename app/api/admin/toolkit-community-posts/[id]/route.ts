import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCached } from "@/lib/auth-session-cache";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { toolkitCommunityPosts, user } from "@/lib/schema";

async function verifyAdmin() {
  const session = await getSessionCached(await headers());
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }
  const [userRecord] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!canAccessAdminTab(userRecord?.role, "toolkits")) {
    return { error: "Forbidden", status: 403 };
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminError = await verifyAdmin();
    if (adminError) {
      return NextResponse.json({ error: adminError.error }, { status: adminError.status });
    }

    const { id: postId } = await params;
    const body = await request.json();

    const {
      type,
      title,
      body: postBody,
      options,
      attachmentUrl,
      attachmentName,
      attachmentType,
      isPublished,
      orderIndex,
    } = body;

    const [updatedPost] = await db
      .update(toolkitCommunityPosts)
      .set({
        type,
        title,
        body: postBody,
        options,
        attachmentUrl,
        attachmentName,
        attachmentType,
        isPublished,
        orderIndex,
        updatedAt: new Date(),
      })
      .where(eq(toolkitCommunityPosts.id, postId))
      .returning();

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error updating community post:", error);
    return NextResponse.json(
      { error: "Failed to update community post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminError = await verifyAdmin();
    if (adminError) {
      return NextResponse.json({ error: adminError.error }, { status: adminError.status });
    }

    const { id: postId } = await params;

    const [deletedPost] = await db
      .delete(toolkitCommunityPosts)
      .where(eq(toolkitCommunityPosts.id, postId))
      .returning();

    if (!deletedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community post:", error);
    return NextResponse.json(
      { error: "Failed to delete community post" },
      { status: 500 }
    );
  }
}
