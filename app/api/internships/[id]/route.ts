import { db } from "@/lib/db";
import { internships, user } from "@/lib/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { opportunities } from "@/data/opportunities";

const internshipUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["remote", "hybrid", "onsite"]).optional().nullable(),
  timing: z.enum(["full_time", "part_time"]).optional().nullable(),
  link: z.string().url("Valid application link is required").optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  stipend: z.number().min(0).optional().nullable(),
  hiringOrganization: z
    .string()
    .min(1, "Hiring organization is required")
    .optional(),
  hiringManager: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
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

    // Handle static IDs
    if (id.startsWith("static-")) {
      const dbId = parseInt(id.replace("static-", ""), 10);
      const opp = opportunities.find((o) => o.id === dbId);

      if (opp) {
        // Map tags to determine type
        let type = "in-office";
        if (opp.tags?.some(t => t.toLowerCase().includes("remote"))) type = "work-from-home";
        else if (opp.tags?.some(t => t.toLowerCase().includes("hybrid"))) type = "hybrid";

        const staticInternship = {
          id: `static-${opp.id}`,
          title: opp.title,
          description: opp.description || "",
          type: type,
          timing: "full-time",
          link: "",
          poster: opp.logo || "",
          tags: opp.tags || [],
          location: type === "work-from-home" ? "Remote" : type === "hybrid" ? "Hybrid" : "Onsite",
          deadline: opp.deadline || new Date().toISOString(),
          stipend: 0,
          hiringOrganization: opp.company,
          hiringManager: "",
          hiringManagerEmail: "",
          experience: "Beginner",
          duration: "3 months",
          eligibility: [],
          isFlagged: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isVerified: true,
          isActive: true,
          viewCount: 0,
          applicationCount: 0,
          userId: "system",
          user: {
            id: "system",
            name: "System",
            image: "",
            role: "admin" as const
          }
        };

        return NextResponse.json({
          success: true,
          internship: staticInternship
        });
      }

      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

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
        experience: internships.experience,
        duration: internships.duration,
        createdAt: internships.createdAt,
        updatedAt: internships.updatedAt,
        isVerified: internships.isVerified,
        isActive: internships.isActive,
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
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await db
      .update(internships)
      .set({ viewCount: sql`${internships.viewCount} + 1` })
      .where(eq(internships.id, id));
    return NextResponse.json({
      success: true,
      internship: internship[0],
    });
  } catch (error) {
    console.error("Error fetching internship:", error);
    return NextResponse.json(
      { error: "Failed to fetch internship" },
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

    // Guard against static IDs
    if (id.startsWith("static-")) {
      return NextResponse.json(
        { error: "Static internships cannot be modified" },
        { status: 405 }
      );
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
    const isAdmin = currentUser.currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
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
      updateData.link = validatedData.link.trim();
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
    if (validatedData.stipend !== undefined) {
      updateData.stipend = validatedData.stipend;
    }
    if (validatedData.isVerified !== undefined && isAdmin) {
      updateData.isVerified = validatedData.isVerified;
    }
    if (validatedData.isActive !== undefined && isAdmin) {
      updateData.isActive = validatedData.isActive;
    }

    const updatedInternship = await db
      .update(internships)
      .set(updateData)
      .where(eq(internships.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      internship: updatedInternship[0],
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

    // Prevent deletion of static internships
    if (id.startsWith("static-")) {
      return NextResponse.json(
        { error: "Static internships cannot be modified" },
        { status: 405 }
      );
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
    const isAdmin = currentUser.currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
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
