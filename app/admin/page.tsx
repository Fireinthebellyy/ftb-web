import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import NewInternshipButton from "@/components/internship/NewInternshipButton";
import { AdminTabs } from "./AdminTabs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";

const adminTabValues = [
  "opportunities",
  "users",
  "toolkits",
  "coupons",
  "ungatekeep",
] as const;

type AdminPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const isInsideAdminPage =
    typeof tabParam === "string" &&
    adminTabValues.includes(tabParam as (typeof adminTabValues)[number]);

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

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-4 xl:px-6">
        {!isInsideAdminPage ? (
          <div className="mb-8">
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <NewInternshipButton />
            </div>
            <p className="text-muted-foreground">
              Manage users, opportunities, and platform content
            </p>
          </div>
        ) : null}

        <Suspense
          fallback={<div className="bg-muted h-64 animate-pulse rounded-lg" />}
        >
          <AdminTabs currentUserId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
