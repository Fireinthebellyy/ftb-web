import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUsersTable from "./AdminUsersTable";
import AdminOpportunitiesTable from "./AdminOpportunitiesTable";
import NewToolkitModal from "@/components/toolkit/NewToolkitModal";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage users and review opportunities
              </p>
            </div>
            <NewToolkitModal>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Toolkit
              </Button>
            </NewToolkitModal>
          </div>
        </div>

        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="opportunities">
              Pending Opportunities
            </TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          <TabsContent value="opportunities">
            <AdminOpportunitiesTable />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsersTable currentUserId={session.user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
