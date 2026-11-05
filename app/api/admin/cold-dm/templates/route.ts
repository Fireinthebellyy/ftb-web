import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coldDmTemplates } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";

export async function GET(_request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.currentUser || (currentUser.currentUser.role !== "admin" && currentUser.currentUser.role !== "editor")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const templates = await db.query.coldDmTemplates.findMany({
      orderBy: [coldDmTemplates.orderIndex],
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Error fetching Cold DM templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    } = body;

    if (!title || !type || !fileUrl || !price) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [newTemplate] = await db
      .insert(coldDmTemplates)
      .values({
        title,
        description: description || null,
        type,
        fileUrl,
        fileName: fileName || null,
        fileSize: fileSize || null,
        price,
        originalPrice: originalPrice || null,
        previewImageUrl: previewImageUrl || null,
        checkoutTitle: checkoutTitle || null,
        checkoutDescription: checkoutDescription || null,
        benefits: benefits || null,
        orderIndex: orderIndex || 0,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      template: newTemplate,
    });
  } catch (error) {
    console.error("Error creating Cold DM template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    );
  }
}
