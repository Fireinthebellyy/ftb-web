"use client";

import { Skeleton } from "@/components/ui/skeleton";
import LessonSidebar from "@/components/toolkit/LessonSidebar";
import { cn } from "@/lib/utils";
import { ToolkitContentItem } from "@/types/interfaces";

interface ToolkitContentSidebarProps {
  items: ToolkitContentItem[];
  currentItemId: string;
  completedItems: string[];
  isAccessLoading: boolean;
  desktopSidebarOpen: boolean;
  onItemSelect: (item: ToolkitContentItem) => void;
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-4 w-28" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function ToolkitContentSidebar({
  items,
  currentItemId,
  completedItems,
  isAccessLoading,
  desktopSidebarOpen,
  onItemSelect,
}: ToolkitContentSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden w-72 shrink-0 lg:order-last lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-l lg:bg-white",
        !desktopSidebarOpen && "lg:hidden"
      )}
    >
      {isAccessLoading ? (
        <SidebarSkeleton />
      ) : (
        <LessonSidebar
          items={items}
          currentItemId={currentItemId}
          onItemSelect={onItemSelect}
          completedItems={completedItems}
        />
      )}
    </aside>
  );
}
