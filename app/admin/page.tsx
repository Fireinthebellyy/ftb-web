import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminUsersTable from "./AdminUsersTable";

export default async function AdminPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Check if user is admin
    const currentUser = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id),
        columns: {
            role: true,
        },
    });

    if (!currentUser || currentUser.role !== "admin") {
        redirect("/");
    }

    return <AdminUsersTable currentUserId={session.user.id} />;
}

