import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
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
