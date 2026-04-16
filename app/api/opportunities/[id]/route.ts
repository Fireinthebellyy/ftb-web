import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { opportunities } from "@/lib/schema";
import {
  getExistingTagIdsOrThrow,
  InvalidTagSelectionError,
} from "@/lib/tags";
import { normalizeDateOnly } from "@/lib/date-utils";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateOpportunitySchema = z.object({
  type: z
    .enum([
      "competitions_open_calls",
      "case_competitions",
      "hackathons",
      "fellowships",
      "ideathon_think_tanks",
      "leadership_programs",
      "awards_recognition",
      "grants_scholarships",
      "research_paper_ra_calls",
      "upskilling_events",
    ])
    .optional(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  images: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  organiserInfo: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  applyLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
  publishAt: z
    .union([
      z
        .string()
        .min(1)
        .refine((s) => !Number.isNaN(new Date(s).getTime()), {
          message: "Invalid datetime",
        }),
      z.literal(""),
      z.null(),
    ])
    .optional(),
});

function parsePublishAt(
  publishAt: string | "" | null | undefined
): Date | null | undefined {
  if (publishAt === undefined) return undefined;
  if (publishAt === "" || publishAt === null) return null;

  const parsed = new Date(publishAt);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed;
}

// ===================== UPDATE =====================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    if (!user || !user.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateOpportunitySchema.parse(body);

    const existingOpportunity = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    if (existingOpportunity.length === 0) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // ✅ FIX: ADMIN CAN EDIT
    if (
      existingOpportunity[0].userId !== user.currentUser.id &&
      user.currentUser.role !== "admin" &&
      user.currentUser.role !== "editor"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to edit this opportunity" },
        { status: 403 }
      );
    }

    const updateData: any = {};

    if (validatedData.type !== undefined) updateData.type = validatedData.type;

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;

    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;

    if (validatedData.images !== undefined)
      updateData.images = validatedData.images;

    if (validatedData.attachments !== undefined)
      updateData.attachments = validatedData.attachments;

    if (validatedData.tags !== undefined)
      updateData.tagIds = await getExistingTagIdsOrThrow(validatedData.tags);

    if (validatedData.location !== undefined)
      updateData.location = validatedData.location;

    if (validatedData.organiserInfo !== undefined)
      updateData.organiserInfo = validatedData.organiserInfo;

    if (validatedData.applyLink !== undefined)
      updateData.applyLink = validatedData.applyLink;

    if (validatedData.startDate !== undefined) {
      const normalizedStartDate = normalizeDateOnly(validatedData.startDate);
      if (normalizedStartDate !== undefined) {
        updateData.startDate = normalizedStartDate;
      }
    }

    if (validatedData.endDate !== undefined) {
      const normalizedEndDate = normalizeDateOnly(validatedData.endDate);
      if (normalizedEndDate !== undefined) {
        updateData.endDate = normalizedEndDate;
      }
    }

    const parsedPublishAt = parsePublishAt(validatedData.publishAt);
    if (parsedPublishAt !== undefined) {
      updateData.publishAt = parsedPublishAt;
    }

    const [updatedOpportunity] = await db
      .update(opportunities)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, id))
      .returning();

    return NextResponse.json(
      { success: true, data: updatedOpportunity },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof InvalidTagSelectionError) {
      return NextResponse.json(
        {
          error: "Please select tags from existing suggestions only.",
          invalidTags: error.invalidTags,
        },
        { status: 400 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating opportunity:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ===================== DELETE =====================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    if (!user || !user.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingOpportunity = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    if (existingOpportunity.length === 0) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // ✅ FIX: ADMIN CAN DELETE
    if (
      existingOpportunity[0].userId !== user.currentUser.id &&
      user.currentUser.role !== "admin" &&
      user.currentUser.role !== "editor"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to delete this opportunity" },
        { status: 403 }
      );
    }

    // ✅ SOFT DELETE
    await db
      .update(opportunities)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(eq(opportunities.id, id));

    return NextResponse.json(
      { message: "Opportunity deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
