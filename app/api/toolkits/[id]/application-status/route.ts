import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sessionApplications } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const application = await db.query.sessionApplications.findFirst({
      where: and(
        eq(sessionApplications.toolkitId, id),
        eq(sessionApplications.userId, session.user.id)
      ),
    });

    if (application) {
      return NextResponse.json({ applied: true, application });
    } else {
      return NextResponse.json({ applied: false });
    }
  } catch (error) {
    console.error("[APPLICATION_STATUS_GET]", error);
    return NextResponse.json(
      { error: "Failed to check application status" },
      { status: 500 }
    );
  }
}
