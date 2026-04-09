import { db } from "@/lib/db";
import { logAdminActivity } from "@/lib/admin-activity";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { opportunities, tags, user } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

const updateOpportunitySchema = z.object({
  action: z.enum(["approve", "reject", "toggle"]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !canAccessAdminTab(currentUser.currentUser?.role, "OpportunityManagement")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    const row = await db
      .select({
        id: opportunities.id,
        type: opportunities.type,
        title: opportunities.title,
        description: opportunities.description,
        images: opportunities.images,
        attachments: opportunities.attachments,
        tags: sql<string[]>`(
          SELECT coalesce(array_agg(t.name ORDER BY t.name), '{}')
          FROM ${tags} t
          WHERE t.id = ANY(${opportunities.tagIds})
        )`,
        location: opportunities.location,
        organiserInfo: opportunities.organiserInfo,
        startDate: opportunities.startDate,
        endDate: opportunities.endDate,
        applyLink: opportunities.applyLink,
        publishAt: opportunities.publishAt,
        isFlagged: opportunities.isFlagged,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
        isVerified: opportunities.isVerified,
        isActive: opportunities.isActive,
        upvoteCount: opportunities.upvoteCount,
        upvoterIds: opportunities.upvoterIds,
        userId: opportunities.userId,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
          role: user.role,
        },
      })
      .from(opportunities)
      .leftJoin(user, eq(opportunities.userId, user.id))
      .where(and(eq(opportunities.id, id), isNull(opportunities.deletedAt)))
      .limit(1);

    if (row.length === 0) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, opportunity: row[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;
  let activityAfterState: unknown = null;

  try {
    if (!db) {
      activityStatus = 500;
      activityError = "Database connection not available";
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    // Check if admin
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (!canAccessAdminTab(currentUser?.currentUser?.role, "opportunities")) {
      activityStatus = 403;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const opportunityId = id;
    activityEntityId = opportunityId;

    if (!opportunityId) {
      activityStatus = 400;
      activityError = "Opportunity ID is required";
      return NextResponse.json(
        { error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateOpportunitySchema.parse(body);

    const existingOpportunity = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, opportunityId))
      .limit(1);

    if (existingOpportunity.length === 0) {
      activityStatus = 404;
      activityError = "Opportunity not found";
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    activityBeforeState = existingOpportunity[0];

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.action === "approve") {
      updateData.isActive = true;
      updateData.isVerified = true;
    } else if (validatedData.action === "reject") {
      updateData.isActive = false;
    } else if (validatedData.action === "toggle") {
      updateData.isActive = !existingOpportunity[0].isActive;
    }

    const updatedOpportunity = await db
      .update(opportunities)
      .set(updateData)
      .where(eq(opportunities.id, opportunityId))
      .returning();

    if (updatedOpportunity.length === 0) {
      activityStatus = 404;
      activityError = "Opportunity not found";
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    activityAfterState = updatedOpportunity[0];
    activityStatus = 200;

    return NextResponse.json(
      {
        success: true,
        message:
          validatedData.action === "approve"
            ? "Opportunity approved successfully"
            : "Opportunity rejected successfully",
        opportunity: updatedOpportunity[0],
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      activityStatus = 400;
      activityError = error.errors;
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    activityError = error;
    console.error("Error updating opportunity:", error);
    activityStatus = 500;

    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request: req,
      action: "admin.opportunities.review",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "opportunity",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;

  try {
    if (!db) {
      activityStatus = 500;
      activityError = "Database connection not available";

      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    // Check admin
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;

    if (currentUser?.currentUser?.role !== "admin") {
      activityStatus = 403;
      activityError = "Unauthorized";

      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    activityEntityId = id;

    if (!id) {
      activityStatus = 400;
      activityError = "Opportunity ID is required";

      return NextResponse.json(
        { error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    const existingOpportunity = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    if (existingOpportunity.length === 0) {
      activityStatus = 404;
      activityError = "Opportunity not found";

      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    activityBeforeState = existingOpportunity[0];

    await db.delete(opportunities).where(eq(opportunities.id, id));

    activityStatus = 200;

    return NextResponse.json({
      success: true,
      message: "Opportunity deleted successfully",
    });
  } catch (error) {
    activityError = error;
    activityStatus = 500;

    console.error("Error deleting opportunity:", error);

    return NextResponse.json(
      { error: "Failed to delete opportunity" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request: req,
      action: "admin.opportunities.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "opportunity",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: null,
      error: activityError,
    });
  }
}
