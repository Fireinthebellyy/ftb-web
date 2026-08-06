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
      isBuddyOfferEnabled: settings[0]?.isBuddyOfferEnabled ?? false,
      buddyOfferTitle: settings[0]?.buddyOfferTitle ?? "Friendship Day Offer",
      buddyOfferText: settings[0]?.buddyOfferText ?? "Learning is better together! Enter your friend's email below so they can get access that too at 20% off",
    });
  } catch (error) {
    console.error("Error fetching public site settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
