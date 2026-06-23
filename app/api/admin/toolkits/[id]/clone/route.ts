import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { toolkits, toolkitContentItems } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  const { id } = await params;

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

    // 1. Fetch original toolkit
    const originalToolkitList = await db
      .select()
      .from(toolkits)
      .where(eq(toolkits.id, id))
      .limit(1);

    if (originalToolkitList.length === 0) {
      activityStatus = 404;
      activityError = "Toolkit not found";
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    const originalToolkit = originalToolkitList[0];

    // 2. Clone the toolkit
    const newToolkitResult = await db
      .insert(toolkits)
      .values({
        ...originalToolkit,
        id: undefined, // Let db generate a new UUID
        title: `${originalToolkit.title}-cloned`,
        isActive: false, // Set false by default for clones
        createdAt: undefined,
        updatedAt: undefined,
        userId: currentUser.currentUser.id,
      })
      .returning();

    const newToolkit = newToolkitResult[0];

    // 3. Fetch original content items
    const originalContentItems = await db
      .select()
      .from(toolkitContentItems)
      .where(eq(toolkitContentItems.toolkitId, id));

    // 4. Clone content items if any
    if (originalContentItems.length > 0) {
      const clonedItems = originalContentItems.map((item) => ({
        ...item,
        id: undefined,
        toolkitId: newToolkit.id,
        createdAt: undefined,
        updatedAt: undefined,
      }));

      await db.insert(toolkitContentItems).values(clonedItems);
    }

    activityStatus = 201;
    return NextResponse.json(newToolkit, { status: 201 });
  } catch (error) {
    activityError = error;
    console.error("Error cloning toolkit:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to clone toolkit" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.toolkits.clone",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "toolkit",
      entityId: id,
      error: activityError,
    });
  }
}
