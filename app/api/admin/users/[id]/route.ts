import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { userRoles, type UserRole } from "@/lib/admin-permissions";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;
  let activityAfterState: unknown = null;

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

    const { id } = await params;
    activityEntityId = id;

    const targetUserBefore = await db.query.user.findFirst({
      where: eq(userTable.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!targetUserBefore) {
      activityStatus = 404;
      activityError = "User not found";
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    activityBeforeState = targetUserBefore;

    const body = await request.json();
    const { role } = body as { role?: UserRole };

    if (!role || !userRoles.includes(role)) {
      activityStatus = 400;
      activityError =
        "Invalid role. Must be one of: user, member, editor, admin";
      return NextResponse.json(
        {
          error: "Invalid role. Must be one of: user, member, editor, admin",
        },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (id === session.user.id) {
      activityStatus = 400;
      activityError = "Cannot change your own role";
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Update user role
    const [updated] = await db
      .update(userTable)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, id))
      .returning({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
      });

    if (!updated) {
      activityStatus = 404;
      activityError = "User not found";
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    activityAfterState = updated;
    activityStatus = 200;
    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    activityError = error;
    Sentry.captureException(error, {
      tags: {
        action: "admin.users.update_role",
      },
      user: {
        id: activityAdminUserId ?? undefined,
      },
      extra: {
        targetUserId: activityEntityId,
      },
    });
    console.error("Error updating user role:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.users.update_role",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "user",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}
