import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    activityAdminUserId = session.user.id;

    // Check if user is admin
    const currentUser = await db.query.user.findFirst({
      where: eq(userTable.id, session.user.id),
      columns: {
        role: true,
      },
    });

    if (!currentUser || currentUser.role !== "admin") {
      activityStatus = 403;
      activityError = "Forbidden";
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        image: userTable.image,
        createdAt: userTable.createdAt,
        emailVerified: userTable.emailVerified,
      })
      .from(userTable)
      .orderBy(desc(userTable.createdAt));

    activityStatus = 200;
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    activityError = error;
    console.error("Error fetching users:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  } finally {
    await logAdminActivity({
      request,
      action: "admin.users.list",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "user",
      error: activityError,
    });
  }
}
