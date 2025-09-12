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
    const { name, image, fieldInterests, opportunityInterests, dateOfBirth, collegeInstitute, contactNumber, currentRole } = body as {
      name?: string;
      image?: string;
      fieldInterests?: string[];
      opportunityInterests?: string[];
      dateOfBirth?: string;
      collegeInstitute?: string;
      contactNumber?: string;
      currentRole?: string;
    };

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

    // Validate interests types
    if (
      typeof fieldInterests !== "undefined" &&
      !(
        Array.isArray(fieldInterests) &&
        fieldInterests.every((v) => typeof v === "string")
      )
    ) {
      return new Response(JSON.stringify({ error: "Invalid fieldInterests" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (typeof dateOfBirth !== "undefined" && typeof dateOfBirth !== "string") {
      return new Response(JSON.stringify({ error: "Invalid dateOfBirth" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (
      typeof collegeInstitute !== "undefined" &&
      (typeof collegeInstitute !== "string" ||
        /[^a-zA-Z0-9\s.&'()-]/.test(collegeInstitute) ||
        /^\d+$/.test(collegeInstitute))
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid collegeInstitute" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (
      typeof contactNumber !== "undefined" &&
      (typeof contactNumber !== "string" || !/^\d{10}$/.test(contactNumber))
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid contactNumber" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (
      typeof currentRole !== "undefined" &&
      (typeof currentRole !== "string" || currentRole.length > 60)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid currentRole" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (
      typeof opportunityInterests !== "undefined" &&
      !(
        Array.isArray(opportunityInterests) &&
        opportunityInterests.every((v) => typeof v === "string")
      )
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid opportunityInterests" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    const [updated] = await db
      .update(userTable)
      .set({
        name,
        image: image ?? null,
        fieldInterests: fieldInterests ?? [],
        opportunityInterests: opportunityInterests ?? [],
        dateOfBirth: dateOfBirth ?? null,
        collegeInstitute: collegeInstitute ?? null,
        contactNumber: contactNumber ?? null,
        currentRole: currentRole ?? null,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id))
      .returning({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
        fieldInterests: userTable.fieldInterests,
        opportunityInterests: userTable.opportunityInterests,
        dateOfBirth: userTable.dateOfBirth,
        collegeInstitute: userTable.collegeInstitute,
        contactNumber: userTable.contactNumber,
        currentRole: userTable.currentRole,
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
