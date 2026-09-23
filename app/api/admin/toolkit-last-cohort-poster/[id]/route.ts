import { NextResponse } from "next/server";

import { db } from "@/lib/db";

import { toolkitLastCohortPoster } from "@/lib/schema";

import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";

import { headers } from "next/headers";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deletedPosters = await db
    .delete(toolkitLastCohortPoster)
    .where(eq(toolkitLastCohortPoster.id, id))
    .returning();

  if (deletedPosters.length === 0) {
    return NextResponse.json(
      { error: "Poster not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    deletedPoster: deletedPosters[0],
  });
}