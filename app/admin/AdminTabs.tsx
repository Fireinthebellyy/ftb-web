"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUsersTable from "./AdminUsersTable";
import AdminOpportunitiesTable from "./AdminOpportunitiesTable";
import AdminToolkitsTable from "./AdminToolkitsTable";
import AdminUngatekeepTable from "./AdminUngatekeepTable";
import AdminCouponsTable from "./AdminCouponsTable";

const TAB_VALUES = ["opportunities", "users", "toolkits", "coupons", "ungatekeep"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isValidTab(value: string | null): value is TabValue {
  return value !== null && TAB_VALUES.includes(value as TabValue);
}

export function AdminTabs({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const activeTab = isValidTab(tab) ? tab : "opportunities";

  const setTab = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <Tabs value={activeTab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="opportunities">Pending Opportunities</TabsTrigger>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="toolkits">Toolkit Management</TabsTrigger>
        <TabsTrigger value="coupons">Coupons</TabsTrigger>
        <TabsTrigger value="ungatekeep">Ungatekeep</TabsTrigger>
      </TabsList>
      <TabsContent value="opportunities">
        <AdminOpportunitiesTable />
      </TabsContent>
      <TabsContent value="users">
        <AdminUsersTable currentUserId={currentUserId} />
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
  );
}
