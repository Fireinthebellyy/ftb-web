import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import NewInternshipButton from "@/components/internship/NewInternshipButton";
import {
  canAccessAdminPanel,
  getAllowedAdminTabs,
  isAdminTab,
} from "@/lib/admin-permissions";
import { AdminTabs } from "./AdminTabs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";

type AdminPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: {
      role: true,
    },
  });

  if (!currentUser || !canAccessAdminPanel(currentUser.role)) {
    redirect("/");
  }

  const allowedTabs = getAllowedAdminTabs(currentUser.role);
  const isInsideAdminPage =
    typeof tabParam === "string" &&
    isAdminTab(tabParam) &&
    allowedTabs.includes(tabParam);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-4 xl:px-6">
        {!isInsideAdminPage ? (
          <div className="mb-8">
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              {currentUser.role === "admin" ? <NewInternshipButton /> : null}
            </div>
            <p className="text-muted-foreground">
              Manage users, opportunities, and platform content
            </p>
          </div>
        ) : null}

        <Suspense
          fallback={<div className="bg-muted h-64 animate-pulse rounded-lg" />}
        >
          <AdminTabs
            currentUserId={session.user.id}
            currentUserRole={currentUser.role}
          />
        </Suspense>
      </div>
    </div>
  );
}
