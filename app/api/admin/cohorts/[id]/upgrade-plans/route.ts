import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortUpgradePlans, cohorts } from "@/lib/schema";
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
      !canAccessAdminTab(currentUser.currentUser.role, "cohorts")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cohortId } = await params;
    const plans = await db
      .select()
      .from(cohortUpgradePlans)
      .where(eq(cohortUpgradePlans.cohortId, cohortId))
      .orderBy(asc(cohortUpgradePlans.orderIndex));

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching admin cohort upgrade plans:", error);
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
      !canAccessAdminTab(currentUser.currentUser.role, "cohorts")
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cohortId } = await params;
    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, cohortId),
    });

    if (!cohort) {
      activityStatus = 404;
      activityError = "Cohort not found";
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    const body = await request.json();

    // Check for preset initialization
    if (body.action === "init_presets") {
      // Guard: reject if plans already exist for this cohort
      const existing = await db.query.cohortUpgradePlans.findFirst({
        where: eq(cohortUpgradePlans.cohortId, cohortId),
      });
      if (existing) {
        activityStatus = 409;
        activityError = "Upgrade plans already exist for this cohort";
        return NextResponse.json(
          { error: "Upgrade plans already exist for this cohort" },
          { status: 409 }
        );
      }

      const defaultPresets = [
        {
          cohortId,
          title: "3-Session Skill Pack",
          description: "Access any 3 live cohort sessions of your choice",
          price: 1499,
          originalPrice: 2499,
          includedSessionCount: 3,
          includedSessionIds: [],
          isAllInOne: false,
          badgeText: "Starter Pack",
          features: [
            "Access 3 Live Sessions",
            "Resource & Slide Downloads",
            "Session Q&A Access",
          ],
          orderIndex: 0,
          isActive: true,
        },
        {
          cohortId,
          title: "Pro Multi-Session Pass",
          description: "Access 6 live sessions with extended recordings",
          price: 2999,
          originalPrice: 4999,
          includedSessionCount: 6,
          includedSessionIds: [],
          isAllInOne: false,
          badgeText: "Most Popular",
          features: [
            "Access 6 Live Sessions",
            "Session Recordings Access",
            "All Resource Downloads",
            "Priority Support & Q&A",
          ],
          orderIndex: 1,
          isActive: true,
        },
        {
          cohortId,
          title: "All-In-One Full Cohort Access",
          description: "Complete access to all live sessions, recordings & mentorship",
          price: 4999,
          originalPrice: 8999,
          includedSessionCount: 99,
          includedSessionIds: [],
          isAllInOne: true,
          badgeText: "Best Value",
          features: [
            "Unlock ALL Sessions & Recordings",
            "Direct Mentor Q&A & Reviews",
            "All Resource & Code Artifact Downloads",
            "Verified Cohort Completion Certificate",
          ],
          orderIndex: 2,
          isActive: true,
        },
      ];

      const inserted = await db
        .insert(cohortUpgradePlans)
        .values(defaultPresets)
        .returning();

      activityStatus = 201;
      activityAfterState = inserted;
      return NextResponse.json(inserted, { status: 201 });
    }

    const {
      title,
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

    if (!title?.trim()) {
      activityStatus = 400;
      activityError = "Title is required";
      return badRequest("Plan title is required", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["title"],
      });
    }

    if (typeof price !== "number" || price < 0) {
      activityStatus = 400;
      activityError = "Valid price is required";
      return badRequest("Price must be a non-negative number", {
        code: "INVALID_PRICE",
        fields: ["price"],
      });
    }

    const [newPlan] = await db
      .insert(cohortUpgradePlans)
      .values({
        cohortId,
        title: title.trim(),
        description: description || null,
        price,
        originalPrice: originalPrice ?? null,
        includedSessionCount: includedSessionCount ?? 1,
        includedSessionIds: includedSessionIds || [],
        isAllInOne: isAllInOne ?? false,
        badgeText: badgeText || null,
        features: features || [],
        orderIndex: orderIndex ?? 0,
        isActive: isActive ?? true,
      })
      .returning();

    activityAfterState = newPlan;
    activityEntityId = newPlan.id;
    activityStatus = 201;

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating cohort upgrade plan:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create upgrade plan" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.upgrade_plans.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_upgrade_plan",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
