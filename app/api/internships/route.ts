import { db } from "@/lib/db";
import {
  SQL,
  and,
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
import { getSessionCached } from "@/lib/auth-session-cache";
import { headers } from "next/headers";
import { z } from "zod";
import { opportunities } from "@/data/opportunities";

const internshipSchema = z.object({
  type: z.enum(["in-office", "work-from-home", "hybrid"], {
    required_error: "Please select an internship type.",
    invalid_type_error: "Please select an internship type.",
  }),
  timing: z.enum(["full-time", "part-time", "shift-based"], {
    required_error: "Please select an internship timing option.",
    invalid_type_error: "Please select an internship timing option.",
  }),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  link: z.string().url().optional().or(z.literal("")),
  poster: z.string().min(1, "Company logo is required"),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  deadline: z.string().optional(),
  stipend: z.number().min(0).optional(),
  hiringOrganization: z.string().min(1, "Hiring organization is required"),
  hiringManager: z.string().optional(),
  hiringManagerEmail: z.string().email().optional().or(z.literal("")),
  experience: z.string().optional(),
  duration: z.string().optional(),
  eligibility: z.array(z.string()).optional(),
});

interface StaticInternship {
  id: string;
  type: string;
  timing: string;
  title: string;
  description: string;
  link: string;
  poster: string;
  tags: string[];
  location: string;
  deadline: string;
  stipend: number;
  hiringOrganization: string;
  hiringManager: string;
  hiringManagerEmail: string;
  experience: string;
  duration: string;
  eligibility: string[];
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  isActive: boolean;
  viewCount: number;
  applicationCount: number;
  userId: string;
  source: "static";
  user: {
    id: string;
    name: string;
    image: string;
    role: "admin";
  };
}

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

    // Build insertData with explicit type
    const insertData: typeof internships.$inferInsert = {
      type: validatedData.type,
      timing: validatedData.timing,
      title: validatedData.title,
      description: validatedData.description,
      poster: validatedData.poster,
      hiringOrganization: validatedData.hiringOrganization,
      userId: user.currentUser.id,
      isFlagged: false,
      isVerified: false,
      isActive: canPostDirectly,
    };

    // Handle optional fields
    if (validatedData.link) insertData.link = validatedData.link;
    if (validatedData.location) insertData.location = validatedData.location;
    if (validatedData.hiringManager)
      insertData.hiringManager = validatedData.hiringManager;
    if (validatedData.hiringManagerEmail)
      insertData.hiringManagerEmail = validatedData.hiringManagerEmail;
    if (validatedData.experience)
      insertData.experience = validatedData.experience;
    if (validatedData.duration) insertData.duration = validatedData.duration;
    if (
      validatedData.eligibility &&
      Array.isArray(validatedData.eligibility) &&
      validatedData.eligibility.length > 0
    ) {
      insertData.eligibility = validatedData.eligibility;
    }
    if (validatedData.stipend !== undefined)
      insertData.stipend = validatedData.stipend;

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
        userRole: user.currentUser.role,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating internship:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
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

    // Optionally check if current user is admin (don't redirect)
    let isAdmin = false;
    try {
      const requestHeaders = await headers();
      const hasCookie = Boolean(requestHeaders.get("cookie"));
      if (hasCookie) {
        const session = await getSessionCached(requestHeaders);
        isAdmin = session?.user?.role === "admin";
      }
    } catch {
      // No session - treat as non-admin
    }

    // Get pagination and filter parameters
    const { searchParams } = new URL(req.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);
    const searchParam = searchParams.get("search");
    const typesParam = searchParams.get("types");
    const tagsParam = searchParams.get("tags");
    const locationParam = searchParams.get("location");
    const minStipendParam = Number.parseInt(
      searchParams.get("minStipend") ?? "",
      10
    );
    const maxStipendParam = Number.parseInt(
      searchParams.get("maxStipend") ?? "",
      10
    );

    const limit = Number.isNaN(limitParam) ? 10 : limitParam;
    const offset = Number.isNaN(offsetParam) ? 0 : offsetParam;
    const searchTerm = searchParam ? searchParam.trim() : "";
    const rawTypes = typesParam
      ? typesParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
      : [];
    const allowedTypes = (internships.type.enumValues ?? []) as string[];
    const validTypes = rawTypes.filter((type) => allowedTypes.includes(type));
    const rawTags = tagsParam
      ? tagsParam
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
      : [];
    const location = locationParam ? locationParam.trim() : "";
    const minStipend = Number.isNaN(minStipendParam)
      ? undefined
      : minStipendParam;
    const maxStipend = Number.isNaN(maxStipendParam)
      ? undefined
      : maxStipendParam;

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
      const tagConditions = rawTags.map(
        (tag) =>
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

    const filters =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const paginated = await db
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
      .where(filters)
      .orderBy(desc(internships.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = paginated.length > limit;
    const pageItems = hasMore ? paginated.slice(0, limit) : paginated;
    const totalCount = hasMore ? offset + limit + 1 : offset + pageItems.length;

    let finalInternships: (typeof paginated[0] | StaticInternship)[] = pageItems;
    let finalTotal = totalCount;
    let finalHasMore = hasMore;

    // Fallback to static data if DB is empty and no specific filters are applied
    // This ensures the "Coming Soon" feeling is replaced by actual data the user expects from the source code
    if (totalCount === 0 && offset === 0 && !searchTerm && validTypes.length === 0 && rawTags.length === 0 && !location && minStipend === undefined && maxStipend === undefined) {
      console.warn("DB empty — falling back to static internships");

      const staticInternships: StaticInternship[] = opportunities.map((opp) => {
        // Map tags to determine type
        let type = "in-office";
        if (opp.tags?.some(t => t.toLowerCase().includes("remote"))) type = "work-from-home";
        else if (opp.tags?.some(t => t.toLowerCase().includes("hybrid"))) type = "hybrid";

        // Map Opportunity to Internship structure
        return {
          id: `static-${opp.id}`,
          title: opp.title,
          description: opp.description || "",
          type: type,
          timing: "full-time", // Default
          link: "",
          poster: opp.logo || "",
          tags: opp.tags || [],
          location: "Remote", // Default or infer
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
          isVerified: false,
          isActive: true,
          viewCount: 0,
          applicationCount: 0,
          userId: "system",
          source: "static",
          user: {
            id: "system",
            name: "System",
            image: "",
            role: "admin" as const
          }
        };
      });

      // Filter static data if search/filters were meant to be applied (basic client-side filtering for fallback)
      // For now, just return all since we checked !searchTerm etc above. 
      // If we want to support filtering on static data, we'd need more logic here.

      finalInternships = staticInternships.slice(offset, offset + limit);
      finalTotal = staticInternships.length;
      finalHasMore = offset + limit < finalTotal;
    }

    return NextResponse.json(
      {
        success: true,
        internships: finalInternships,
        pagination: {
          limit,
          offset,
          total: finalTotal,
          hasMore: finalHasMore,
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
