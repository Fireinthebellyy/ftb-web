import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminActivityLogs, user } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { role: true },
    });
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action")?.trim();
    const entityType = searchParams.get("entityType")?.trim();
    const adminUserId = searchParams.get("adminUserId")?.trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);

    const limit = Number.isNaN(limitParam)
      ? 50
      : Math.min(Math.max(limitParam, 1), 200);
    const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid from date parameter" },
          { status: 400 }
        );
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid to date parameter" },
          { status: 400 }
        );
      }
    }

    const filters: SQL<unknown>[] = [];
    if (action) {
      filters.push(eq(adminActivityLogs.action, action));
    }
    if (entityType) {
      filters.push(eq(adminActivityLogs.entityType, entityType));
    }
    if (adminUserId) {
      filters.push(eq(adminActivityLogs.adminUserId, adminUserId));
    }

    if (from) {
      filters.push(gte(adminActivityLogs.createdAt, new Date(from)));
    }
    if (to) {
      filters.push(lte(adminActivityLogs.createdAt, new Date(to)));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const rows = await db
      .select({
        id: adminActivityLogs.id,
        adminUserId: adminActivityLogs.adminUserId,
        adminUserName: user.name,
        action: adminActivityLogs.action,
        entityType: adminActivityLogs.entityType,
        entityId: adminActivityLogs.entityId,
        method: adminActivityLogs.method,
        path: adminActivityLogs.path,
        statusCode: adminActivityLogs.statusCode,
        success: adminActivityLogs.success,
        ipAddress: adminActivityLogs.ipAddress,
        userAgent: adminActivityLogs.userAgent,
        requestId: adminActivityLogs.requestId,
        metadata: adminActivityLogs.metadata,
        beforeState: adminActivityLogs.beforeState,
        afterState: adminActivityLogs.afterState,
        error: adminActivityLogs.error,
        createdAt: adminActivityLogs.createdAt,
      })
      .from(adminActivityLogs)
      .leftJoin(user, eq(adminActivityLogs.adminUserId, user.id))
      .where(whereClause)
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ logs: rows, pagination: { limit, offset } });
  } catch (error) {
    console.error("Error fetching admin activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin activity logs" },
      { status: 500 }
    );
  }
}
