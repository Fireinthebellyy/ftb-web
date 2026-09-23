import { NextResponse } from "next/server";

import { db, dbPool } from "@/lib/db";
import { toolkitLastCohortPoster } from "@/lib/schema";

import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { z } from "zod";

const posterSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posters = await db
    .select()
    .from(toolkitLastCohortPoster)
    .where(eq(toolkitLastCohortPoster.isActive, true));

  return NextResponse.json(posters[0] ?? null);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();

  const parsed = posterSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid data",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

    const newPoster = await dbPool.transaction(async (tx) => {
    await tx
      .update(toolkitLastCohortPoster)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(toolkitLastCohortPoster.isActive, true));

    const [poster] = await tx
      .insert(toolkitLastCohortPoster)
      .values({
        imageUrl: parsed.data.imageUrl,
        isActive: parsed.data.isActive ?? true,
      })
      .returning();

    return poster;
  });

  return NextResponse.json(newPoster);
}