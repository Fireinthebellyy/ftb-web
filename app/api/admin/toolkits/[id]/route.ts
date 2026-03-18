import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";
import { db } from "@/lib/db";
import { toolkits } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateToolkitSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  price: z
    .number()
    .min(0, "Price must be greater than or equal to 0")
    .optional(),
  originalPrice: z
    .number()
    .min(0, "Original price must be greater than or equal to 0")
    .optional(),
  coverImageUrl: z.string().url("Invalid cover image URL").optional(),
  bannerImageUrl: z.string().url("Invalid banner image URL").optional(),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
  contentUrl: z
    .string()
    .url("Invalid content URL")
    .optional()
    .or(z.literal("")),
  category: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  testimonials: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        role: z.string().min(1, "Role is required"),
        message: z.string().min(1, "Message is required"),
      })
    )
    .optional(),
  totalDuration: z.string().optional(),
  lessonCount: z
    .number()
    .int("Lesson count must be an integer")
    .min(0, "Lesson count must be greater than or equal to 0")
    .optional(),
  isActive: z.boolean().optional(),
  showSaleBadge: z.boolean().optional(),
});

export async function PUT(
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
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;
    activityEntityId = toolkitId;

    const existingToolkit = await db
      .select()
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!existingToolkit.length) {
      activityStatus = 404;
      activityError = "Toolkit not found";
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }
    activityBeforeState = existingToolkit[0];

    const body = await request.json();

    const validationResult = updateToolkitSchema.safeParse(body);
    if (!validationResult.success) {
      activityStatus = 400;
      activityError = validationResult.error.errors;
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.title !== undefined) updates.title = validatedData.title;
    if (validatedData.description !== undefined)
      updates.description = validatedData.description;
    if (validatedData.price !== undefined) updates.price = validatedData.price;
    if (validatedData.originalPrice !== undefined)
      updates.originalPrice = validatedData.originalPrice;
    if (validatedData.coverImageUrl !== undefined)
      updates.coverImageUrl = validatedData.coverImageUrl;
    if (validatedData.bannerImageUrl !== undefined)
      updates.bannerImageUrl = validatedData.bannerImageUrl;
    if (validatedData.videoUrl !== undefined)
      updates.videoUrl = validatedData.videoUrl;
    if (validatedData.contentUrl !== undefined)
      updates.contentUrl = validatedData.contentUrl;
    if (validatedData.category !== undefined)
      updates.category = validatedData.category;
    if (validatedData.highlights !== undefined)
      updates.highlights = validatedData.highlights;
    if (validatedData.testimonials !== undefined)
      updates.testimonials = validatedData.testimonials;
    if (validatedData.totalDuration !== undefined)
      updates.totalDuration = validatedData.totalDuration;
    if (validatedData.lessonCount !== undefined)
      updates.lessonCount = validatedData.lessonCount;
    if (validatedData.isActive !== undefined)
      updates.isActive = validatedData.isActive;
    if (validatedData.showSaleBadge !== undefined)
      updates.showSaleBadge = validatedData.showSaleBadge;

    const updatedToolkit = await db
      .update(toolkits)
      .set(updates)
      .where(eq(toolkits.id, toolkitId))
      .returning();

    if (!updatedToolkit || updatedToolkit.length === 0) {
      activityStatus = 404;
      activityError = "Toolkit not found";
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    activityAfterState = updatedToolkit[0];
    activityStatus = 200;
    return NextResponse.json(updatedToolkit[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      activityStatus = 400;
      activityError = error.errors;
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    activityError = error;
    console.error("Error updating toolkit:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to update toolkit" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.toolkits.update",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "toolkit",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      afterState: activityAfterState,
      error: activityError,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activityStatus = 500;
  let activityError: unknown = null;
  let activityAdminUserId: string | null = null;
  let activityEntityId: string | null = null;
  let activityBeforeState: unknown = null;

  try {
    const currentUser = await getCurrentUser();
    activityAdminUserId = currentUser?.currentUser?.id ?? null;
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      currentUser.currentUser.role !== "admin"
    ) {
      activityStatus = 401;
      activityError = "Unauthorized";
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const toolkitId = paramsResolved.id;
    activityEntityId = toolkitId;

    const existingToolkit = await db
      .select()
      .from(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .limit(1);

    if (!existingToolkit.length) {
      activityStatus = 404;
      activityError = "Toolkit not found";
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }
    activityBeforeState = existingToolkit[0];

    const deletedToolkit = await db
      .delete(toolkits)
      .where(eq(toolkits.id, toolkitId))
      .returning();

    if (!deletedToolkit || deletedToolkit.length === 0) {
      activityStatus = 404;
      activityError = "Toolkit not found";
      return NextResponse.json({ error: "Toolkit not found" }, { status: 404 });
    }

    activityStatus = 200;
    return NextResponse.json({ success: true });
  } catch (error) {
    activityError = error;
    console.error("Error deleting toolkit:", error);
    activityStatus = 500;
    return NextResponse.json(
      { error: "Failed to delete toolkit" },
      { status: 500 }
    );
  } finally {
    void logAdminActivity({
      request,
      action: "admin.toolkits.delete",
      statusCode: activityStatus,
      success: activityStatus >= 200 && activityStatus < 300,
      adminUserId: activityAdminUserId,
      entityType: "toolkit",
      entityId: activityEntityId,
      beforeState: activityBeforeState,
      error: activityError,
    });
  }
}
