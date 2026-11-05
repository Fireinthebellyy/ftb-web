import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coldDmTemplates } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser?.currentUser || (currentUser.currentUser.role !== "admin" && currentUser.currentUser.role !== "editor")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      fileUrl,
      fileName,
      fileSize,
      price,
      originalPrice,
      previewImageUrl,
      checkoutTitle,
      checkoutDescription,
      benefits,
      orderIndex,
      isActive,
    } = body;

    const [updatedTemplate] = await db
      .update(coldDmTemplates)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileName !== undefined && { fileName }),
        ...(fileSize !== undefined && { fileSize }),
        ...(price !== undefined && { price }),
        ...(originalPrice !== undefined && { originalPrice }),
        ...(previewImageUrl !== undefined && { previewImageUrl }),
        ...(checkoutTitle !== undefined && { checkoutTitle }),
        ...(checkoutDescription !== undefined && { checkoutDescription }),
        ...(benefits !== undefined && { benefits }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(coldDmTemplates.id, id))
      .returning();

    if (!updatedTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("Error updating Cold DM template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser?.currentUser || (currentUser.currentUser.role !== "admin" && currentUser.currentUser.role !== "editor")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [deletedTemplate] = await db
      .delete(coldDmTemplates)
      .where(eq(coldDmTemplates.id, id))
      .returning();

    if (!deletedTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: deletedTemplate,
    });
  } catch (error) {
    console.error("Error deleting Cold DM template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
