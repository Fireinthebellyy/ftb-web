import { db } from "@/lib/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { internships, tags, user } from "@/lib/schema";
import { upsertTagsAndGetIds } from "@/lib/tags";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const internshipUpdateSchema = z.object({
  type: z.enum(["in-office", "work-from-home", "hybrid"]).optional(),
  timing: z.enum(["full-time", "part-time", "shift-based"]).optional(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  link: z.string().url().optional().or(z.literal("")),
  poster: z.string().min(1, "Company logo is required").optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  deadline: z.string().optional(),
  stipend: z.number().min(0).optional(),
  hiringOrganization: z.string().min(1, "Hiring organization is required").optional(),
  hiringManager: z.string().optional(),
  hiringManagerEmail: z.string().email().optional().or(z.literal("")),
  experience: z.string().optional(),
  duration: z.string().optional(),
  eligibility: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const internship = await db
      .select({
        id: internships.id,
        type: internships.type,
        timing: internships.timing,
        title: internships.title,
        description: internships.description,
        link: internships.link,
        poster: internships.poster,
        tags: sql<string[]>`(
          SELECT coalesce(array_agg(t.name ORDER BY t.name), '{}')
          FROM ${tags} t
          WHERE t.id = ANY(${internships.tagIds})
        )`,
        location: internships.location,
        deadline: internships.deadline,
        stipend: internships.stipend,
        hiringOrganization: internships.hiringOrganization,
        hiringManager: internships.hiringManager,
        hiringManagerEmail: internships.hiringManagerEmail,
        experience: internships.experience,
        duration: internships.duration,
        eligibility: internships.eligibility,
        isFlagged: internships.isFlagged,
        createdAt: internships.createdAt,
        updatedAt: internships.updatedAt,
        isVerified: internships.isVerified,
        isActive: internships.isActive,
        viewCount: internships.viewCount,
        applicationCount: internships.applicationCount,
        userId: internships.userId,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
          role: user.role,
        },
      })
      .from(internships)
      .leftJoin(user, eq(internships.userId, user.id))
      .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
      .limit(1);

    if (internship.length === 0) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    // Increment view count
    await db
      .update(internships)
      .set({ viewCount: sql`${internships.viewCount} + 1`})
      .where(eq(internships.id, id));

    return NextResponse.json({
      success: true,
      internship: { ...internship[0], viewCount: internship[0].viewCount + 1 }
    });
  } catch (error) {
    console.error("Error fetching internship:", error);
    return NextResponse.json({ error: "Failed to fetch internship" }, { status: 500 });
  }
}

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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = internshipUpdateSchema.parse(body);

    // Check if internship exists and user has permission
    const existingInternship = await db
      .select()
      .from(internships)
      .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
      .limit(1);

    if (existingInternship.length === 0) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    const internship = existingInternship[0];
    const isOwner = internship.userId === currentUser.currentUser.id;
    const isAdmin = currentUser.currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build updateData
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle optional fields
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.timing !== undefined) updateData.timing = validatedData.timing;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.link !== undefined) updateData.link = validatedData.link;
    if (validatedData.poster !== undefined) updateData.poster = validatedData.poster;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.hiringOrganization !== undefined) updateData.hiringOrganization = validatedData.hiringOrganization;
    if (validatedData.hiringManager !== undefined) updateData.hiringManager = validatedData.hiringManager;
    if (validatedData.hiringManagerEmail !== undefined) updateData.hiringManagerEmail = validatedData.hiringManagerEmail;
    if (validatedData.experience !== undefined) updateData.experience = validatedData.experience;
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
    if (validatedData.eligibility !== undefined) {
      if (Array.isArray(validatedData.eligibility) && validatedData.eligibility.length > 0) {
        updateData.eligibility = validatedData.eligibility;
      } else {
        updateData.eligibility = [];
      }
    }
    if (validatedData.stipend !== undefined) updateData.stipend = validatedData.stipend;
    if (validatedData.isActive !== undefined && isAdmin) updateData.isActive = validatedData.isActive;

    // Handle tags
    if (validatedData.tags && Array.isArray(validatedData.tags)) {
      const tagIds = await upsertTagsAndGetIds(validatedData.tags);
      updateData.tagIds = tagIds;
    }

    // Handle deadline
    if (validatedData.deadline !== undefined) {
      if (validatedData.deadline) {
        const deadline = new Date(validatedData.deadline);
        if (!isNaN(deadline.getTime())) {
          updateData.deadline = deadline.toISOString().split("T")[0];
        }
      } else {
        updateData.deadline = null;
      }
    }

    const updatedInternship = await db
      .update(internships)
      .set(updateData)
      .where(eq(internships.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedInternship[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating internship:", error);
    return NextResponse.json({ error: "Failed to update internship" }, { status: 500 });
  }
}

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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if internship exists and user has permission
    const existingInternship = await db
      .select()
      .from(internships)
      .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
      .limit(1);

    if (existingInternship.length === 0) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    const internship = existingInternship[0];
    const isOwner = internship.userId === currentUser.currentUser.id;
    const isAdmin = currentUser.currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    await db
      .update(internships)
      .set({ deletedAt: new Date() })
      .where(eq(internships.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting internship:", error);
    return NextResponse.json({ error: "Failed to delete internship" }, { status: 500 });
  }
}
