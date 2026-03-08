"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ComponentType } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CircleCheck,
  RadioTower,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminUsersTable from "./AdminUsersTable";
import AdminOpportunitiesTable from "./AdminOpportunitiesTable";
import AdminToolkitsTable from "./AdminToolkitsTable";
import AdminUngatekeepTable from "./AdminUngatekeepTable";
import AdminCouponsTable from "./AdminCouponsTable";

const TAB_VALUES = [
  "opportunities",
  "users",
  "toolkits",
  "coupons",
  "ungatekeep",
] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isValidTab(value: string | null): value is TabValue {
  return value !== null && TAB_VALUES.includes(value as TabValue);
}

const adminCards: Array<{
  key: TabValue;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    key: "opportunities",
    title: "Pending Opportunities",
    description:
      "Review and approve or reject opportunities submitted by users",
    icon: CircleCheck,
  },
  {
    key: "users",
    title: "User Management",
    description: "Manage user accounts and assign roles (user, member, admin)",
    icon: Users,
  },
  {
    key: "toolkits",
    title: "Toolkit Management",
    description: "Create and manage paid toolkits with lessons and content",
    icon: BookOpen,
  },
  {
    key: "coupons",
    title: "Coupons",
    description: "Create and manage discount coupons for toolkit purchases",
    icon: Ticket,
  },
  {
    key: "ungatekeep",
    title: "Ungatekeep",
    description:
      "Manage announcements, resources, and company experience posts",
    icon: RadioTower,
  },
];

export function AdminTabs({ currentUserId }: { currentUserId: string }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const activeTab = isValidTab(tab) ? tab : null;

  if (!activeTab) {
    return (
      <div className="flex flex-wrap gap-4">
        {adminCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.key}
              href={`/admin?tab=${card.key}`}
              className="group relative min-h-44 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md sm:w-[22rem]"
            >
              <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-neutral-400 transition group-hover:text-orange-500" />
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900">
                {card.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" /> Back to admin home
          </Link>
        </Button>
      </div>

      {activeTab === "opportunities" ? <AdminOpportunitiesTable /> : null}
      {activeTab === "users" ? (
        <AdminUsersTable currentUserId={currentUserId} />
      ) : null}
      {activeTab === "toolkits" ? <AdminToolkitsTable /> : null}
      {activeTab === "coupons" ? <AdminCouponsTable /> : null}
      {activeTab === "ungatekeep" ? <AdminUngatekeepTable /> : null}
    </div>
  );
}
