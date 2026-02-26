"use client";

import { Check, ChevronRight } from "lucide-react";
import BunnyPlayer from "@/components/toolkit/BunnyPlayer";
import HtmlRenderer from "@/components/toolkit/HtmlRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ToolkitContentItem } from "@/types/interfaces";

interface ToolkitContentMainProps {
  currentItem: ToolkitContentItem | null;
  completedItems: string[];
  isAccessLoading: boolean;
  isFirst: boolean;
  isLast: boolean;
  desktopSidebarOpen: boolean;
  onMarkComplete: (itemId: string) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onCompleteLast: () => void;
}

function MainContentSkeleton() {
  return (
    <div className="mx-auto space-y-6 lg:max-w-3xl">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-32" />
        <Skeleton className="h-10 w-full sm:w-32" />
      </div>
    </div>
  );
}

export default function ToolkitContentMain({
  currentItem,
  completedItems,
  isAccessLoading,
  isFirst,
  isLast,
  desktopSidebarOpen,
  onMarkComplete,
  onNavigatePrev,
  onNavigateNext,
  onCompleteLast,
}: ToolkitContentMainProps) {
  if (isAccessLoading) {
    return <MainContentSkeleton />;
  }

  if (!currentItem) {
    return (
      <div className="flex h-40 items-center justify-center text-center">
        <p className="text-sm text-gray-500">
          No content available for this toolkit yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto space-y-6 transition-all duration-300",
        desktopSidebarOpen ? "lg:max-w-3xl" : "lg:max-w-4xl"
      )}
    >
      {currentItem.type === "video" && currentItem.bunnyVideoUrl && (
        <BunnyPlayer
          videoId={currentItem.id}
          title={currentItem.title}
          className="shadow-sm"
        />
      )}

      {currentItem.type === "article" && currentItem.content && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <HtmlRenderer
              content={currentItem.content}
              protected={true}
              itemId={currentItem.id}
              onComplete={onMarkComplete}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          onClick={onNavigatePrev}
          disabled={isFirst}
          className="w-full sm:w-auto"
        >
          <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
          Previous
        </Button>

        {!isLast ? (
          <Button onClick={onNavigateNext} className="w-full sm:w-auto">
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onCompleteLast} className="w-full sm:w-auto">
            <Check className="mr-2 h-4 w-4" />
            Complete
          </Button>
        )}
      </div>

      {!completedItems.includes(currentItem.id) ? null : (
        <p className="text-sm text-green-700">Completed lesson</p>
      )}
    </div>
  );
}
