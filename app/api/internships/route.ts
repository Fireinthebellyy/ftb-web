import { db } from "@/lib/db";
import {
  SQL,
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  gte,
  lte,
} from "drizzle-orm";
import { internships, tags, user } from "@/lib/schema";
import { upsertTagsAndGetIds } from "@/lib/tags";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const internshipSchema = z.object({
  type: z.enum(["part-time", "full-time", "contract", "remote"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  link: z.string().optional(),
  poster: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  deadline: z.string().optional(),
  stipend: z.number().min(0).optional(),
  hiringOrganization: z.string().min(1, "Hiring organization is required"),
  hiringManager: z.string().optional(),
});

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const validatedData = internshipSchema.parse(body);

    // Check user role - users with role "user" need approval, members and admins can post directly
    const userRole = user.currentUser.role;
    const canPostDirectly = userRole === "admin" || userRole === "member";

    // Build insertData
    const insertData: any = {
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      hiringOrganization: validatedData.hiringOrganization,
      userId: user.currentUser.id,
      isFlagged: false,
      isVerified: false,
      isActive: canPostDirectly,
    };

    // Handle optional fields
    if (validatedData.link) insertData.link = validatedData.link;
    if (validatedData.poster) insertData.poster = validatedData.poster;
    if (validatedData.location) insertData.location = validatedData.location;
    if (validatedData.hiringManager) insertData.hiringManager = validatedData.hiringManager;
    if (validatedData.stipend !== undefined) insertData.stipend = validatedData.stipend;

    // Handle tags
    if (validatedData.tags && Array.isArray(validatedData.tags)) {
      const tagIds = await upsertTagsAndGetIds(validatedData.tags);
      if (tagIds.length > 0) {
        insertData.tagIds = tagIds;
      }
    }

    // Handle deadline
    if (validatedData.deadline) {
      const deadline = new Date(validatedData.deadline);
      if (!isNaN(deadline.getTime())) {
        insertData.deadline = deadline.toISOString().split("T")[0];
      }
    }

    const newInternship = await db
      .insert(internships)
      .values(insertData)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newInternship[0],
        userRole: user.currentUser.role
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating internship:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    // Check if current user is admin
    const currentUser = await getCurrentUser();
    const isAdmin = currentUser?.currentUser?.role === "admin";

    // Get pagination and filter parameters
    const { searchParams } = new URL(req.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);
    const searchParam = searchParams.get("search");
    const typesParam = searchParams.get("types");
    const tagsParam = searchParams.get("tags");
    const locationParam = searchParams.get("location");
    const minStipendParam = Number.parseInt(searchParams.get("minStipend") ?? "", 10);
    const maxStipendParam = Number.parseInt(searchParams.get("maxStipend") ?? "", 10);

    const limit = Number.isNaN(limitParam) ? 10 : limitParam;
    const offset = Number.isNaN(offsetParam) ? 0 : offsetParam;
    const searchTerm = searchParam ? searchParam.trim() : "";
    const rawTypes = typesParam
      ? typesParam.split(",").map((value) => value.trim()).filter(Boolean)
      : [];
    const allowedTypes = (internships.type.enumValues ?? []) as string[];
    const validTypes = rawTypes.filter((type) => allowedTypes.includes(type));
    const rawTags = tagsParam
      ? tagsParam.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
      : [];
    const location = locationParam ? locationParam.trim() : "";
    const minStipend = Number.isNaN(minStipendParam) ? undefined : minStipendParam;
    const maxStipend = Number.isNaN(maxStipendParam) ? undefined : maxStipendParam;

    const conditions: SQL<unknown>[] = [isNull(internships.deletedAt)];

    // Only show active internships to non-admin users
    if (!isAdmin) {
      conditions.push(eq(internships.isActive, true));
    }

    if (searchTerm) {
      conditions.push(
        or(
          ilike(internships.title, `%${searchTerm}%`),
          ilike(internships.description, `%${searchTerm}%`),
          ilike(internships.hiringOrganization, `%${searchTerm}%`)
        )
      );
    }

    if (validTypes.length > 0) {
      conditions.push(inArray(internships.type, validTypes as any));
    }

    if (rawTags.length > 0) {
      const tagConditions = rawTags.map((tag) =>
        sql`EXISTS (
          SELECT 1
          FROM ${tags} t
          WHERE lower(t.name) = ${tag}
            AND t.id = ANY(${internships.tagIds})
        )`
      );

      if (tagConditions.length === 1) {
        conditions.push(tagConditions[0]);
      } else {
        conditions.push(or(...tagConditions));
      }
    }

    if (location) {
      conditions.push(ilike(internships.location, `%${location}%`));
    }

    if (minStipend !== undefined) {
      conditions.push(gte(internships.stipend, minStipend));
    }

    if (maxStipend !== undefined) {
      conditions.push(lte(internships.stipend, maxStipend));
    }

    const filters = conditions.length === 1 ? conditions[0] : and(...conditions);

    const totalResult = await db
      .select({ total: count() })
      .from(internships)
      .where(filters);

    const totalCount = totalResult[0]?.total ?? 0;

    const paginated = await db
      .select({
        id: internships.id,
        type: internships.type,
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
      .where(filters)
      .orderBy(desc(internships.createdAt))
      .limit(limit)
      .offset(offset);

    const hasMore = offset + paginated.length < totalCount;

    return NextResponse.json(
      {
        success: true,
        internships: paginated,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching internships:", error);
    return NextResponse.json(
      { error: "Failed to fetch internships" },
      { status: 500 }
    );
  }
}
