import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import NewInternshipButton from "@/components/internship/NewInternshipButton";
import { AdminTabs } from "./AdminTabs";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <NewInternshipButton />
          </div>
          <p className="text-muted-foreground">
            Manage users and review opportunities
          </p>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
          <AdminTabs currentUserId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
