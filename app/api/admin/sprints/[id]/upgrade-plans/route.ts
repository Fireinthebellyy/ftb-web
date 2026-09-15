import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sprintUpgradePlans, sprints } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq, asc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId } = await params;
    const plans = await db
      .select()
      .from(sprintUpgradePlans)
      .where(eq(sprintUpgradePlans.sprintId, sprintId))
      .orderBy(asc(sprintUpgradePlans.orderIndex));

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching admin sprint upgrade plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch upgrade plans" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityAfterState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId } = await params;
    const sprint = await db.query.sprints.findFirst({
      where: eq(sprints.id, sprintId),
    });

    if (!sprint) {
      activityStatus = 404;
      activityError = "Sprint not found";
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const body = await request.json();

    if (body.action === "init_presets") {
      const existing = await db.query.sprintUpgradePlans.findFirst({
        where: eq(sprintUpgradePlans.sprintId, sprintId),
      });
      if (existing) {
        activityStatus = 409;
        activityError = "Upgrade plans already exist for this sprint";
        return NextResponse.json(
          { error: "Upgrade plans already exist for this sprint" },
          { status: 409 }
        );
      }

      const defaultPresets = [
        {
          sprintId,
          title: "3-Session Skill Pack",
          description: "Access any 3 live sprint sessions of your choice",
          price: 1499,
          originalPrice: 2499,
          includedSessionCount: 3,
          includedSessionIds: [],
          isAllInOne: false,
          badgeText: "POPULAR",
          features: ["3 Live Sessions", "Session Recordings", "Q&A Access"],
          orderIndex: 0,
          isActive: true,
        },
        {
          sprintId,
          title: "Full Pass",
          description: "Full access to all sprint sessions and premium features",
          price: 2999,
          originalPrice: 4999,
          includedSessionCount: 0,
          includedSessionIds: [],
          isAllInOne: true,
          badgeText: "BEST VALUE",
          features: ["All Live Sessions", "Lifetime Recordings", "Priority Support"],
          orderIndex: 1,
          isActive: true,
        },
      ];

      const inserted = await db
        .insert(sprintUpgradePlans)
        .values(defaultPresets)
        .returning();

      activityAfterState = inserted;
      activityStatus = 201;
      return NextResponse.json(inserted, { status: 201 });
    }

    const {
      title,
      sectionLabel,
      description,
      price,
      originalPrice,
      includedSessionCount,
      includedSessionIds,
      isAllInOne,
      badgeText,
      features,
      orderIndex,
      isActive,
    } = body;

    if (!title?.trim() || price === undefined || price === null) {
      activityStatus = 400;
      activityError = "Title and price are required";
      return badRequest("Title and price are required.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["title", "price"],
      });
    }

    const newPlan = await db
      .insert(sprintUpgradePlans)
      .values({
        sprintId,
        title: title.trim(),
        sectionLabel: sectionLabel || null,
        description: description || null,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        includedSessionCount: includedSessionCount ? Number(includedSessionCount) : 1,
        includedSessionIds: Array.isArray(includedSessionIds) ? includedSessionIds : [],
        isAllInOne: Boolean(isAllInOne),
        badgeText: badgeText || null,
        features: Array.isArray(features) ? features : [],
        orderIndex: orderIndex ?? 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      })
      .returning();

    activityAfterState = newPlan[0];
    activityStatus = 201;
    return NextResponse.json(newPlan[0], { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating sprint upgrade plan:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create upgrade plan" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.sprints.upgrade_plans.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "sprint_upgrade_plan",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
