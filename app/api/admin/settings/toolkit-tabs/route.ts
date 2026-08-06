import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user.role !== "admin" && session.user.role !== "editor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "global"))
      .limit(1);

    return NextResponse.json({
      toolkitCohortsTabLabel: settings[0]?.toolkitCohortsTabLabel ?? "Live Cohorts",
      toolkitSessionsTabLabel: settings[0]?.toolkitSessionsTabLabel ?? "Sessions",
      toolkitMentorshipTabLabel: settings[0]?.toolkitMentorshipTabLabel ?? "1:1 Mentorship",
      toolkitDigitalProductsTabLabel: settings[0]?.toolkitDigitalProductsTabLabel ?? "Digital products",
    });
  } catch (error) {
    console.error("Error fetching toolkit tab settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user.role !== "admin" && session.user.role !== "editor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      toolkitCohortsTabLabel,
      toolkitSessionsTabLabel,
      toolkitMentorshipTabLabel,
      toolkitDigitalProductsTabLabel,
    } = body;

    const existingSettings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "global"))
      .limit(1);

    if (existingSettings.length === 0) {
      await db.insert(siteSettings).values({
        id: "global",
        toolkitCohortsTabLabel,
        toolkitSessionsTabLabel,
        toolkitMentorshipTabLabel,
        toolkitDigitalProductsTabLabel,
      });
    } else {
      await db
        .update(siteSettings)
        .set({
          toolkitCohortsTabLabel,
          toolkitSessionsTabLabel,
          toolkitMentorshipTabLabel,
          toolkitDigitalProductsTabLabel,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, "global"));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating toolkit tab settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
