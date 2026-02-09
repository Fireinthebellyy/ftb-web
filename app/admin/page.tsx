import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import NewInternshipButton from "@/components/internship/NewInternshipButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import AdminCouponsTable from "./AdminCouponsTable";
import AdminOpportunitiesTable from "./AdminOpportunitiesTable";
import AdminToolkitsTable from "./AdminToolkitsTable";
import AdminUngatekeepTable from "./AdminUngatekeepTable";
import AdminUsersTable from "./AdminUsersTable";

const adminTabs = [
  { value: "opportunities", label: "Pending Opportunities" },
  { value: "users", label: "User Management" },
  { value: "toolkits", label: "Toolkit Management" },
  { value: "coupons", label: "Coupons" },
  { value: "ungatekeep", label: "Ungatekeep" },
] as const;

export default async function AdminPage() {
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <NewInternshipButton />
          </div>
          <p className="text-muted-foreground">
            Manage users, opportunities, and platform content
          </p>
        </div>

        <Tabs defaultValue="opportunities" className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex min-w-max">
              {adminTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="px-3">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="opportunities">
            <AdminOpportunitiesTable />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsersTable currentUserId={session.user.id} />
          </TabsContent>
          <TabsContent value="toolkits">
            <AdminToolkitsTable />
          </TabsContent>
          <TabsContent value="coupons">
            <AdminCouponsTable />
          </TabsContent>
          <TabsContent value="ungatekeep">
            <AdminUngatekeepTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
