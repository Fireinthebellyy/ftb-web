import { db } from "@/lib/db";
import { popups } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Create an object with only the fields that were provided
    const updateData: Partial<typeof popups.$inferInsert> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.type !== undefined) {
      if (body.type !== "text" && body.type !== "image") {
        return NextResponse.json({ error: "Invalid popup type" }, { status: 400 });
      }
      updateData.type = body.type;
    }
    if (body.content !== undefined) updateData.content = body.content;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.delaySeconds !== undefined) updateData.delaySeconds = body.delaySeconds;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    updateData.updatedAt = new Date();

    const [updatedPopup] = await db
      .update(popups)
      .set(updateData)
      .where(eq(popups.id, id))
      .returning();

    if (!updatedPopup) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 });
    }

    return NextResponse.json({ popup: updatedPopup }, { status: 200 });
  } catch (error) {
    console.error("Error updating popup:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deletedPopup] = await db
      .delete(popups)
      .where(eq(popups.id, id))
      .returning();

    if (!deletedPopup) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Popup deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting popup:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
