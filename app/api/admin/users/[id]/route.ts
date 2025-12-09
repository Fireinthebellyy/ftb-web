import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const currentUser = await db.query.user.findFirst({
            where: eq(userTable.id, session.user.id),
            columns: {
                role: true,
            },
        });

        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { role } = body as { role?: "user" | "member" | "admin" };

        if (!role || !["user", "member", "admin"].includes(role)) {
            return NextResponse.json(
                { error: "Invalid role. Must be 'user', 'member', or 'admin'" },
                { status: 400 }
            );
        }

        // Prevent admin from changing their own role
        if (id === session.user.id) {
            return NextResponse.json(
                { error: "Cannot change your own role" },
                { status: 400 }
            );
        }

        // Update user role
        const [updated] = await db
            .update(userTable)
            .set({
                role,
                updatedAt: new Date(),
            })
            .where(eq(userTable.id, id))
            .returning({
                id: userTable.id,
                name: userTable.name,
                email: userTable.email,
                role: userTable.role,
            });

        if (!updated) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user: updated }, { status: 200 });
    } catch (error) {
        console.error("Error updating user role:", error);
        return NextResponse.json(
            { error: "Failed to update user role" },
            { status: 500 }
        );
    }
}

