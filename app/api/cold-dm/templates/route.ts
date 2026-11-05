import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coldDmTemplates, userColdDmTemplates } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/server/users";

export async function GET(_request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    const templates = await db.query.coldDmTemplates.findMany({
      where: eq(coldDmTemplates.isActive, true),
      orderBy: [coldDmTemplates.orderIndex],
    });

    let templatesWithPurchaseStatus = templates;

    if (currentUser?.currentUser?.id) {
      const userPurchases = await db.query.userColdDmTemplates.findMany({
        where: and(
          eq(userColdDmTemplates.userId, currentUser.currentUser.id),
          eq(userColdDmTemplates.paymentStatus, "completed")
        ),
      });

      const purchasedTemplateIds = new Set(
        userPurchases.map((p) => p.templateId)
      );

      templatesWithPurchaseStatus = templates.map((template) => ({
        ...template,
        isPurchased: purchasedTemplateIds.has(template.id),
      }));
    } else {
      templatesWithPurchaseStatus = templates.map((template) => ({
        ...template,
        isPurchased: false,
      }));
    }

    return NextResponse.json({
      success: true,
      templates: templatesWithPurchaseStatus,
    });
  } catch (error) {
    console.error("Error fetching Cold DM templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
