import { NextResponse } from "next/server";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sprintSessionResources } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resourceId } = await params;

    await db
      .delete(sprintSessionResources)
      .where(eq(sprintSessionResources.id, resourceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sprint resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
