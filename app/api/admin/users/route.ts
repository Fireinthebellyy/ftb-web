import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
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

        // Fetch all users
        const users = await db
            .select({
                id: userTable.id,
                name: userTable.name,
                email: userTable.email,
                role: userTable.role,
                image: userTable.image,
                createdAt: userTable.createdAt,
                emailVerified: userTable.emailVerified,
            })
            .from(userTable)
            .orderBy(desc(userTable.createdAt));

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

