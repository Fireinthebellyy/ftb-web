import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sessionApplications, user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const applications = await db
      .select({
        id: sessionApplications.id,
        userId: sessionApplications.userId,
        userName: user.name,
        userEmail: user.email,
        answers: sessionApplications.answers,
        createdAt: sessionApplications.createdAt,
      })
      .from(sessionApplications)
      .leftJoin(user, eq(sessionApplications.userId, user.id))
      .where(eq(sessionApplications.toolkitId, id))
      .orderBy(sessionApplications.createdAt);

    return NextResponse.json(applications);
  } catch (error) {
    console.error("[ADMIN_SESSION_APPLICATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
