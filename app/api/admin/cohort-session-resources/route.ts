import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-error";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { cohortSessionResources } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";

export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      contentId,
      name,
      url,
      type,
      orderIndex,
    } = body;

    if (!contentId?.trim()) {
      activityStatus = 400;
      activityError = "Content ID is required";
      return badRequest("Please provide a content ID.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["contentId"],
      });
    }

    if (!name?.trim()) {
      activityStatus = 400;
      activityError = "Name is required";
      return badRequest("Please provide a resource name.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["name"],
      });
    }

    if (!url?.trim()) {
      activityStatus = 400;
      activityError = "URL is required";
      return badRequest("Please provide a resource URL.", {
        code: "MISSING_REQUIRED_FIELDS",
        fields: ["url"],
      });
    }

    const validTypes = ["file", "video", "link", "image", "pdf", "ppt"];
    if (!type || !validTypes.includes(type)) {
      activityStatus = 400;
      activityError = "Invalid type";
      return badRequest("Please provide a valid resource type.", {
        code: "INVALID_TYPE",
        fields: ["type"],
      });
    }

    const newResource = await db
      .insert(cohortSessionResources)
      .values({
        contentId,
        name,
        url,
        type,
        orderIndex: orderIndex ?? 0,
      })
      .returning();

    activityAfterState = newResource[0];
    activityEntityId = newResource[0].id;
    activityStatus = 201;
    return NextResponse.json(newResource[0], { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error creating resource:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.cohorts.sessions.resources.create",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "cohort_session_resource",
      entityId: activityEntityId,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
