import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCached } from "@/lib/auth-session-cache";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import {
  toolkitCommunityPosts,
  toolkitCommunityResponses,
  user,
} from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: toolkitId, postId } = await params;

    const session = await getSessionCached(await headers());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [userRecord] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!canAccessAdminTab(userRecord?.role, "toolkits")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [post] = await db
      .select()
      .from(toolkitCommunityPosts)
      .where(eq(toolkitCommunityPosts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.toolkitId.toLowerCase() !== toolkitId.toLowerCase()) {
      return NextResponse.json(
        { error: "Post does not belong to this toolkit" },
        { status: 400 }
      );
    }

    const responses = await db
      .select({
        id: toolkitCommunityResponses.id,
        userId: toolkitCommunityResponses.userId,
        textResponse: toolkitCommunityResponses.textResponse,
        attachmentUrl: toolkitCommunityResponses.attachmentUrl,
        attachmentName: toolkitCommunityResponses.attachmentName,
        attachmentType: toolkitCommunityResponses.attachmentType,
        createdAt: toolkitCommunityResponses.createdAt,
        user: {
          name: user.name,
          email: user.email,
          image: user.image,
        }
      })
      .from(toolkitCommunityResponses)
      .leftJoin(user, eq(toolkitCommunityResponses.userId, user.id))
      .where(eq(toolkitCommunityResponses.postId, postId))
      .orderBy(desc(toolkitCommunityResponses.createdAt));

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error fetching QnA responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
