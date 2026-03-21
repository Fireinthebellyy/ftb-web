import { db } from "@/lib/db";
import { internships } from "@/lib/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const internship = await db
      .select({
        id: internships.id,
        isFlagged: internships.isFlagged,
      })
      .from(internships)
      .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
      .limit(1);

    if (internship.length === 0) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 }
      );
    }

    if (internship[0].isFlagged) {
      return NextResponse.json({ success: true, alreadyFlagged: true });
    }

    await db
      .update(internships)
      .set({
        isFlagged: true,
        updatedAt: new Date(),
      })
      .where(eq(internships.id, id));

    return NextResponse.json({ success: true, flagged: true });
  } catch (error) {
    console.error("Error flagging internship:", error);
    return NextResponse.json(
      { error: "Failed to flag internship" },
      { status: 500 }
    );
  }
}
