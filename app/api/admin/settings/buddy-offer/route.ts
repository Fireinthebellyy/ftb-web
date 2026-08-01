import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";
import { z } from "zod";

const buddyOfferSchema = z.object({
  isBuddyOfferEnabled: z.boolean(),
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

    const settings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "global"))
      .limit(1);

    return NextResponse.json({
      isBuddyOfferEnabled: settings[0]?.isBuddyOfferEnabled ?? false,
    });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch site settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityBeforeState: unknown = null;
  let activityAfterState: unknown = null;

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

    const body = await request.json();
    const validatedData = buddyOfferSchema.parse(body);

    const existingSettings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "global"))
      .limit(1);

    activityBeforeState = existingSettings[0];

    const updatedSettings = await db
      .update(siteSettings)
      .set({
        isBuddyOfferEnabled: validatedData.isBuddyOfferEnabled,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, "global"))
      .returning();

    activityAfterState = updatedSettings[0];
    activityStatus = 200;
    return NextResponse.json({
      isBuddyOfferEnabled: updatedSettings[0]?.isBuddyOfferEnabled ?? false,
    });
  } catch (error) {
    activityError = error;
    console.error("Error updating site settings:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.settings.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "site_settings",
      entityId: "global",
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
