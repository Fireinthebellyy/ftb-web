import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const settings = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.id, "global"),
    });

    const order = settings?.ungatekeepFilterTagsOrder || [
      "college_amas",
      "upskill",
      "entrance_exams",
    ];

    const labels = settings?.ungatekeepFilterTagsLabels as Record<string, string> || {};

    return NextResponse.json({ order, labels });
  } catch (error) {
    console.error("Error fetching filter tags order:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter tags order" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { order, labels } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: "Invalid order format" },
        { status: 400 }
      );
    }

    const existingSettings = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.id, "global"),
    });

    if (existingSettings) {
      await db
        .update(siteSettings)
        .set({
          ungatekeepFilterTagsOrder: order,
          ungatekeepFilterTagsLabels: labels || {},
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, "global"));
    } else {
      await db.insert(siteSettings).values({
        id: "global",
        ungatekeepFilterTagsOrder: order,
        ungatekeepFilterTagsLabels: labels || {},
      });
    }

    return NextResponse.json({ success: true, order, labels });
  } catch (error) {
    console.error("Error updating filter tags order:", error);
    return NextResponse.json(
      { error: "Failed to update filter tags order" },
      { status: 500 }
    );
  }
}
