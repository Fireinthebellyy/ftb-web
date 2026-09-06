import { db } from "@/lib/db";
import { internships, internshipReports, user } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";

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
    if (!currentUser || !currentUser.currentUser?.id || currentUser.currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const reportsList = await db
      .select({
        id: internshipReports.id,
        reasonCategory: internshipReports.reasonCategory,
        description: internshipReports.description,
        createdAt: internshipReports.createdAt,
        reporter: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(internshipReports)
      .leftJoin(user, eq(internshipReports.userId, user.id))
      .where(eq(internshipReports.internshipId, id))
      .orderBy(desc(internshipReports.createdAt));

    return NextResponse.json({ reports: reportsList });
  } catch (error) {
    console.error("Error fetching internship reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    if (!currentUser || !currentUser.currentUser?.id || currentUser.currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Delete all report records for this internship
    await db.delete(internshipReports).where(eq(internshipReports.internshipId, id));

    // Reset isFlagged flag on the internship
    await db
      .update(internships)
      .set({
        isFlagged: false,
        updatedAt: new Date(),
      })
      .where(eq(internships.id, id));

    return NextResponse.json({ success: true, unflagged: true });
  } catch (error) {
    console.error("Error clearing internship reports:", error);
    return NextResponse.json(
      { error: "Failed to clear reports" },
      { status: 500 }
    );
  }
}
