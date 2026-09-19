import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sprintMentors } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { eq, asc, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId } = await params;

    const mentors = await db
      .select()
      .from(sprintMentors)
      .where(eq(sprintMentors.sprintId, sprintId))
      .orderBy(asc(sprintMentors.orderIndex), asc(sprintMentors.createdAt));

    return NextResponse.json(mentors);
  } catch (error) {
    console.error("Error fetching sprint mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprint mentors" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId } = await params;
    const body = await request.json();
    const { name, role, imageUrl, bio, link, orderIndex } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Mentor name is required" },
        { status: 400 }
      );
    }

    // Check current mentor count (strict limit of maximum 2 mentors)
    const existingCountResult = await db
      .select({ count: count() })
      .from(sprintMentors)
      .where(eq(sprintMentors.sprintId, sprintId));

    const currentCount = Number(existingCountResult[0]?.count || 0);
    if (currentCount >= 2) {
      return NextResponse.json(
        { error: "Maximum limit of 2 mentors reached for this sprint" },
        { status: 400 }
      );
    }

    const newMentor = await db
      .insert(sprintMentors)
      .values({
        sprintId,
        name: name.trim(),
        role: typeof role === "string" ? role.trim() : "",
        imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
        bio: typeof bio === "string" && bio.trim() ? bio.trim() : null,
        link: typeof link === "string" && link.trim() ? link.trim() : null,
        orderIndex: Number.isFinite(Number(orderIndex)) ? Number(orderIndex) : currentCount,
      })
      .returning();

    return NextResponse.json(newMentor[0]);
  } catch (error) {
    console.error("Error creating sprint mentor:", error);
    return NextResponse.json(
      { error: "Failed to create sprint mentor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sprintId } = await params;
    const body = await request.json();
    const { mentors } = body;

    if (!Array.isArray(mentors)) {
      return NextResponse.json(
        { error: "mentors must be an array" },
        { status: 400 }
      );
    }

    for (let i = 0; i < Math.min(mentors.length, 2); i++) {
      const item = mentors[i];
      if (item.id) {
        await db
          .update(sprintMentors)
          .set({
            orderIndex: i,
            ...(item.name !== undefined ? { name: item.name.trim() } : {}),
            ...(item.role !== undefined ? { role: item.role?.trim() || "" } : {}),
            ...(item.imageUrl !== undefined ? { imageUrl: item.imageUrl?.trim() || null } : {}),
            ...(item.bio !== undefined ? { bio: item.bio?.trim() || null } : {}),
            ...(item.link !== undefined ? { link: item.link?.trim() || null } : {}),
          })
          .where(eq(sprintMentors.id, item.id));
      }
    }

    const updatedList = await db
      .select()
      .from(sprintMentors)
      .where(eq(sprintMentors.sprintId, sprintId))
      .orderBy(asc(sprintMentors.orderIndex), asc(sprintMentors.createdAt));

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("Error updating sprint mentors list:", error);
    return NextResponse.json(
      { error: "Failed to update sprint mentors list" },
      { status: 500 }
    );
  }
}
