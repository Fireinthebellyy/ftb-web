import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { name, image } = body as { name?: string; image?: string };

    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // image is optional and may be empty string. Validate type only.
    if (typeof image !== "undefined" && typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Invalid image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [updated] = await db
      .update(userTable)
      .set({
        name,
        image: image ?? null,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id))
      .returning({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
      });

    if (!updated) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const err = e as Error;
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
