import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";
import { z } from "zod";

const coldDmSettingsSchema = z.object({
  coldDmShowPageBanner: z.boolean(),
  coldDmShowTemplates: z.boolean(),
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
      coldDmShowPageBanner: settings[0]?.coldDmShowPageBanner ?? true,
      coldDmShowTemplates: settings[0]?.coldDmShowTemplates ?? true,
    });
  } catch (error) {
    console.error("Error fetching Cold DM settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch Cold DM settings" },
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
    const validatedData = coldDmSettingsSchema.parse(body);

    const existingSettings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "global"))
      .limit(1);

    activityBeforeState = existingSettings[0];

    const updatedSettings = await db
      .insert(siteSettings)
      .values({
        id: "global",
        coldDmShowPageBanner: validatedData.coldDmShowPageBanner,
        coldDmShowTemplates: validatedData.coldDmShowTemplates,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: {
          coldDmShowPageBanner: validatedData.coldDmShowPageBanner,
          coldDmShowTemplates: validatedData.coldDmShowTemplates,
          updatedAt: new Date(),
        },
      })
      .returning();

    activityAfterState = updatedSettings[0];
    activityStatus = 200;
    return NextResponse.json({
      coldDmShowPageBanner: updatedSettings[0]?.coldDmShowPageBanner ?? true,
      coldDmShowTemplates: updatedSettings[0]?.coldDmShowTemplates ?? true,
    });
  } catch (error) {
    activityError = error;
    console.error("Error updating Cold DM settings:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update Cold DM settings" },
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
