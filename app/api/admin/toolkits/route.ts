import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { toolkitContentItems, toolkits, user as userTable } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { desc, eq, sql } from "drizzle-orm";

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
      currentUser.currentUser.role !== "admin"
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allToolkits = await db
      .select({
        id: toolkits.id,
        title: toolkits.title,
        description: toolkits.description,
        price: toolkits.price,
        originalPrice: toolkits.originalPrice,
        coverImageUrl: toolkits.coverImageUrl,
        videoUrl: toolkits.videoUrl,
        contentUrl: toolkits.contentUrl,
        category: toolkits.category,
        highlights: toolkits.highlights,
        totalDuration: toolkits.totalDuration,
        lessonCount: toolkits.lessonCount,
        isActive: toolkits.isActive,
        showSaleBadge: toolkits.showSaleBadge,
        createdAt: toolkits.createdAt,
        updatedAt: toolkits.updatedAt,
        userId: toolkits.userId,
        creatorName: userTable.name,
      })
      .from(toolkits)
      .leftJoin(userTable, eq(toolkits.userId, userTable.id))
      .orderBy(desc(toolkits.createdAt));

    const lessonCounts = await db
      .select({
        toolkitId: toolkitContentItems.toolkitId,
        lessonCount: sql<number>`count(*)`,
      })
      .from(toolkitContentItems)
      .groupBy(toolkitContentItems.toolkitId);

    const lessonCountByToolkitId = new Map(
      lessonCounts.map((item) => [item.toolkitId, Number(item.lessonCount)])
    );

    const toolkitsWithDynamicLessonCount = allToolkits.map((toolkit) => ({
      ...toolkit,
      lessonCount: lessonCountByToolkitId.get(toolkit.id) ?? 0,
    }));

    activityStatus = 200;
    return NextResponse.json(toolkitsWithDynamicLessonCount);
  } catch (error) {
    activityError = error;
    console.error("Error fetching toolkits:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch toolkits" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.toolkits.list",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "toolkit",
      error: activityError,
    });
  }
}
