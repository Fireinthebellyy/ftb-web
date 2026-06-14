import { db } from "@/lib/db";
import { internships, user } from "@/lib/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

async function getFreshInternship(id: string) {
  const internship = await db
    .select({
      id: internships.id,
      title: internships.title,
      description: internships.description,
      type: internships.type,
      timing: internships.timing,
      link: internships.link,
      tags: internships.tags,
      location: internships.location,
      deadline: internships.deadline,
      stipend: internships.stipend,
      hiringOrganization: internships.hiringOrganization,
      hiringManager: internships.hiringManager,
      hiringManagerEmail: internships.hiringManagerEmail,
      hiringManagerLinkedin: internships.hiringManagerLinkedin,
      experience: internships.experience,
      duration: internships.duration,
      field: internships.field,
      createdAt: internships.createdAt,
      updatedAt: internships.updatedAt,
      isVerified: internships.isVerified,
      isFlagged: internships.isFlagged,
      isActive: internships.isActive,
      userId: internships.userId,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        role: user.role,
      },
      is_trending: sql<boolean>`CASE WHEN ${internships.trendingFeaturedExpiry} IS NOT NULL AND ${internships.trendingFeaturedExpiry} < CURRENT_DATE THEN FALSE ELSE ${internships.is_trending} END`.as("is_trending"),
      is_featured_home: sql<boolean>`CASE WHEN ${internships.trendingFeaturedExpiry} IS NOT NULL AND ${internships.trendingFeaturedExpiry} < CURRENT_DATE THEN FALSE ELSE ${internships.is_featured_home} END`.as("is_featured_home"),
      trending_featured_expiry: internships.trendingFeaturedExpiry,
    })
    .from(internships)
    .leftJoin(user, eq(internships.userId, user.id))
    .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
    .limit(1);
  return internship[0] || null;
}

const internshipUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["remote", "hybrid", "onsite"]).optional().nullable(),
  timing: z.enum(["full_time", "part_time"]).optional().nullable(),
  link: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Valid application link is required",
    }),
  tags: z.array(z.string()).optional(),
  location: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  stipend: z.number().min(0).optional().nullable(),
  hiringOrganization: z
    .string()
    .min(1, "Hiring organization is required")
    .optional(),
  hiringManager: z.string().optional().nullable(),
  hiringManagerEmail: z
    .string()
    .regex(/^(?:[^\s@]+@[^\s@]+\.[^\s@]+)?$/, "Invalid email address")
    .optional()
    .nullable(),
  hiringManagerLinkedin: z
    .string()
    .regex(/^(?:(https?:\/\/)?(www\.)?linkedin\.com\/.*)?$/i, "Invalid LinkedIn URL")
    .optional()
    .nullable(),
  experience: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  field: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  trendingFeaturedExpiry: z.string().optional().nullable(),
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const internship = await getFreshInternship(id);

    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      internship,
    });
  } catch (error) {
    console.error("Error fetching internship:", error);
    return NextResponse.json(
      { error: "Failed to fetch internship" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    const role = currentUser?.currentUser?.role;
    if (!currentUser || (role !== "admin" && role !== "editor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingInternship = await db
      .select()
      .from(internships)
      .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
      .limit(1);

    if (existingInternship.length === 0) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 }
      );
    }

    const internship = existingInternship[0];

  
    let body: Record<string, unknown> = {};
    try {
      body = await _req.json();
    } catch {
      // no body = toggle visibility
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (Object.keys(body).length === 0) {
      updates.isActive = !internship.isActive;
    } else {
      if (body.display_index !== undefined) {
        updates.display_index = body.display_index;
        if (body.trending_index === undefined) {
          updates.trending_index = body.display_index;
        }
      }

      if (body.trending_index !== undefined) {
        updates.trending_index = body.trending_index;
        if (body.display_index === undefined) {
          updates.display_index = body.trending_index;
        }
      }

      if (body.featured_home_index !== undefined) {
        updates.featured_home_index = body.featured_home_index;
      }
      if (body.isActive !== undefined) updates.isActive = body.isActive;
      if (body.isTrending !== undefined) updates.is_trending = body.isTrending;
      if (body.isFeaturedHome !== undefined) updates.is_featured_home = body.isFeaturedHome;
      if (body.trendingFeaturedExpiry !== undefined) {
        updates.trendingFeaturedExpiry = body.trendingFeaturedExpiry;
      }
    }

    await db
      .update(internships)
      .set(updates)
      .where(eq(internships.id, id));

    const updated = await getFreshInternship(id);

    return NextResponse.json({
      success: true,
      internship: updated,
    });
  } catch (error) {
    console.error("Error updating internship:", error);
    return NextResponse.json(
      { error: "Failed to update internship" },
      { status: 500 }
    );
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

    const existingInternship = await db
      .select()
      .from(internships)
      .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
      .limit(1);

    if (existingInternship.length === 0) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 }
      );
    }

    const internship = existingInternship[0];
    const isOwner = internship.userId === currentUser.currentUser.id;
    const isModerator =
      currentUser.currentUser.role === "admin" ||
      currentUser.currentUser.role === "editor";

    if (!isOwner && !isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: typeof internships.$inferInsert = {
      updatedAt: new Date(),
      title: internship.title,
      hiringOrganization: internship.hiringOrganization,
      link: internship.link,
      userId: internship.userId,
    };

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title.trim();
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description?.trim() || null;
    }
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type;
    }
    if (validatedData.timing !== undefined) {
      updateData.timing = validatedData.timing;
    }
    if (validatedData.link !== undefined) {
      updateData.link = validatedData.link ? validatedData.link.trim() : null;
    }
    if (validatedData.tags !== undefined) {
      updateData.tags = validatedData.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
    }
    if (validatedData.location !== undefined) {
      updateData.location = validatedData.location?.trim() || null;
    }
    if (validatedData.hiringOrganization !== undefined) {
      updateData.hiringOrganization = validatedData.hiringOrganization.trim();
    }
    if (validatedData.hiringManager !== undefined) {
      updateData.hiringManager = validatedData.hiringManager?.trim() || null;
    }
    if (validatedData.hiringManagerEmail !== undefined) {
      updateData.hiringManagerEmail = validatedData.hiringManagerEmail?.trim() || null;
    }
    if (validatedData.hiringManagerLinkedin !== undefined) {
      updateData.hiringManagerLinkedin = validatedData.hiringManagerLinkedin?.trim() || null;
    }
    if (validatedData.field !== undefined) {
      updateData.field = validatedData.field?.trim() || null;
    }
    if (validatedData.experience !== undefined) {
      updateData.experience = validatedData.experience?.trim() || null;
    }
    if (validatedData.duration !== undefined) {
      updateData.duration = validatedData.duration?.trim() || null;
    }
    if (validatedData.deadline !== undefined) {
      if (validatedData.deadline) {
        const deadline = new Date(validatedData.deadline);
        if (!Number.isNaN(deadline.getTime())) {
          updateData.deadline = deadline.toISOString().split("T")[0];
        }
      } else {
        updateData.deadline = null;
      }
    }
    if (validatedData.trendingFeaturedExpiry !== undefined) {
      if (validatedData.trendingFeaturedExpiry) {
        const expiry = new Date(validatedData.trendingFeaturedExpiry);
        if (!Number.isNaN(expiry.getTime())) {
          updateData.trendingFeaturedExpiry = expiry.toISOString().split("T")[0];
        }
      } else {
        updateData.trendingFeaturedExpiry = null;
      }
    }
    if (validatedData.stipend !== undefined) {
      updateData.stipend = validatedData.stipend;
    }
    if (validatedData.isVerified !== undefined && isModerator) {
      updateData.isVerified = validatedData.isVerified;
    }
    if (validatedData.isActive !== undefined && isModerator) {
      updateData.isActive = validatedData.isActive;
    }

    await db
      .update(internships)
      .set(updateData)
      .where(eq(internships.id, id));

    const updated = await getFreshInternship(id);

    return NextResponse.json({
      success: true,
      internship: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating internship:", error);
    return NextResponse.json(
      { error: "Failed to update internship" },
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingInternship = await db
      .select()
      .from(internships)
      .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
      .limit(1);

    if (existingInternship.length === 0) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 }
      );
    }

    const internship = existingInternship[0];
    const isOwner = internship.userId === currentUser.currentUser.id;
    const isModerator =
      currentUser.currentUser.role === "admin" ||
      currentUser.currentUser.role === "editor";

    if (!isOwner && !isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .update(internships)
      .set({ deletedAt: new Date() })
      .where(eq(internships.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting internship:", error);
    return NextResponse.json(
      { error: "Failed to delete internship" },
      { status: 500 }
    );
  }
}
