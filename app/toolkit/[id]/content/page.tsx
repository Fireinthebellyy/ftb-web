"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LessonSidebar from "@/components/toolkit/LessonSidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowLeft, Menu, PanelLeft, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolkitContentItem } from "@/types/interfaces";
import ToolkitContentMain from "@/components/toolkit/content/ToolkitContentMain";
import ToolkitContentPageSkeleton from "@/components/toolkit/content/ToolkitContentPageSkeleton";
import ToolkitContentSidebar from "@/components/toolkit/content/ToolkitContentSidebar";
import ToolkitCommunityPanel from "@/components/toolkit/content/ToolkitCommunityPanel";
import {
  useMarkContentComplete,
  useToolkitAccess,
  useToolkitCommunity,
  useToolkitContent,
} from "@/lib/queries-toolkits";
import { Skeleton } from "@/components/ui/skeleton";

const courseChatUrl = "https://api.whatsapp.com/send/?phone=917014885565";

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function CircularProgress({
  progress,
  size = 36,
  strokeWidth = 3,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-green-600 transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-[8px] font-bold text-green-700">
        {Math.round(progress)}%
      </span>
    </div>
  );
}

export default function ToolkitContentPage() {
  const params = useParams();
  const router = useRouter();
  const toolkitId = params.id as string;

  const [currentItem, setCurrentItem] = useState<ToolkitContentItem | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<"lesson" | "community">(
    "lesson"
  );

  const { data: contentData, isLoading: isContentLoading } =
    useToolkitContent(toolkitId);
  const { data: accessData, isLoading: isAccessLoading } =
    useToolkitAccess(toolkitId);
  const markComplete = useMarkContentComplete(toolkitId);

  const toolkit = contentData?.toolkit ?? null;
  const contentItems = useMemo(
    () => contentData?.contentItems ?? [],
    [contentData?.contentItems]
  );
  const hasAccess = accessData?.hasPurchased ?? false;
  // Enable the community query once access data has loaded.
  // The API itself handles admin bypass, so we just need to avoid firing the
  // query while we don't yet know the user's purchase status.
  const communityEnabled = !isAccessLoading;
  const { data: communityData, isLoading: isCommunityLoading } =
    useToolkitCommunity(toolkitId, communityEnabled);
  const completedItems = useMemo(
    () => accessData?.completedItemIds ?? [],
    [accessData?.completedItemIds]
  );

  const progress =
    contentItems.length > 0
      ? (completedItems.length / contentItems.length) * 100
      : 0;

  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (contentItems.length > 0 && !currentItem) {
      const sortedItems = [...contentItems].sort(
        (a, b) => a.orderIndex - b.orderIndex
      );
      setCurrentItem(sortedItems[0]);
    }
  }, [contentItems, currentItem]);

  useEffect(() => {
    if (
      !isAccessLoading &&
      accessData?.registrationRequired &&
      accessData.cohortId &&
      !didRedirectRef.current
    ) {
      didRedirectRef.current = true;
      router.replace(`/toolkit/cohorts/${accessData.cohortId}/registration`);
      return;
    }

    if (
      !isContentLoading &&
      !isAccessLoading &&
      toolkit &&
      !hasAccess &&
      !didRedirectRef.current
    ) {
      didRedirectRef.current = true;
      toast.warning("You need to purchase this toolkit to access content");
      router.push(`/toolkit/${params.id}`);
    }
  }, [
    accessData?.cohortId,
    accessData?.registrationRequired,
    isAccessLoading,
    isContentLoading,
    hasAccess,
    toolkit,
    params.id,
    router,
  ]);

  const handleItemSelect = useCallback((item: ToolkitContentItem): void => {
    setCurrentItem(item);
    setActiveView("lesson");
    setSidebarOpen(false);
  }, []);

  const handleCommunitySelect = useCallback((): void => {
    setActiveView("community");
    setSidebarOpen(false);
  }, []);

  const sortedItems = useMemo(
    () => [...contentItems].sort((a, b) => a.orderIndex - b.orderIndex),
    [contentItems]
  );

  // Mark item as complete (idempotent - does nothing if already complete)
  const handleMarkComplete = useCallback(
    (itemId: string): void => {
      // Skip if already completed
      if (completedItems.includes(itemId)) return;
      // Persist to database
      markComplete.mutate(itemId);
    },
    [completedItems, markComplete]
  );

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (!currentItem || contentItems.length === 0) return;

      const currentIndex = sortedItems.findIndex(
        (item) => item.id === currentItem.id
      );

      let newIndex: number;
      if (direction === "prev") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
      } else {
        // Auto-mark current item as complete when moving to next
        handleMarkComplete(currentItem.id);
        newIndex =
          currentIndex < sortedItems.length - 1
            ? currentIndex + 1
            : currentIndex;
      }

      setCurrentItem(sortedItems[newIndex]);
    },
    [currentItem, contentItems, sortedItems, handleMarkComplete]
  );

  const handleNavigatePrev = useCallback(
    () => handleNavigate("prev"),
    [handleNavigate]
  );
  const handleNavigateNext = useCallback(
    () => handleNavigate("next"),
    [handleNavigate]
  );

  const handleMarkCompleteAndCelebrate = useCallback(() => {
    if (currentItem && !completedItems.includes(currentItem.id)) {
      handleMarkComplete(currentItem.id);
      toast.success("Congratulations! You've completed this toolkit!");
    }
  }, [currentItem, completedItems, handleMarkComplete]);

  if (isContentLoading) {
    return <ToolkitContentPageSkeleton />;
  }

  if (!toolkit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-bold">Toolkit Not Found</h2>
            <p className="mb-4 text-sm text-gray-600">
              We could not load this toolkit.
            </p>
            <Button onClick={() => router.push("/toolkit")} className="w-full">
              Back to Toolkits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAccessLoading && !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-bold">Access Denied</h2>
            <p className="mb-4 text-sm text-gray-600">
              You need to purchase this toolkit to access the content.
            </p>
            <Button
              onClick={() => router.push(`/toolkit/${toolkitId}`)}
              className="w-full"
            >
              Go to Toolkit Overview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentIndex = currentItem
    ? sortedItems.findIndex((item) => item.id === currentItem.id)
    : -1;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sortedItems.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/toolkit/${toolkit.id}`)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-gray-500">{toolkit.title}</p>
              <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                {activeView === "community"
                  ? "FTB Support"
                  : currentItem?.title || "Select a Lesson"}
              </h1>
            </div>
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Course Menu</SheetTitle>
                {isAccessLoading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-6 w-36" />
                    {Array.from({ length: 8 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-14 w-full rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <LessonSidebar
                    items={contentItems}
                    currentItemId={currentItem?.id || ""}
                    onItemSelect={handleItemSelect}
                    completedItems={completedItems}
                    isCommunityActive={activeView === "community"}
                    chatUrl={courseChatUrl}
                    onCommunitySelect={handleCommunitySelect}
                  />
                )}
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
              className="hidden shrink-0 lg:flex"
            >
              {desktopSidebarOpen ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelRight className="h-5 w-5" />
              )}
            </Button>

            <CircularProgress progress={progress} />

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/toolkit/${toolkit.id}`)}
              className="hidden shrink-0 sm:flex"
            >
              Overview
            </Button>
          </div>
        </div>
      </header>

      <div className="lg:flex">
        <main
          className="flex-1 p-4 sm:p-6 lg:min-w-0 lg:overflow-y-auto"
          style={{ width: "100%" }}
        >
          {activeView === "community" ? (
            <ToolkitCommunityPanel
              posts={communityData?.posts ?? []}
              isLoading={isCommunityLoading || isAccessLoading}
              desktopSidebarOpen={desktopSidebarOpen}
              toolkitId={toolkitId}
            />
          ) : (
            <ToolkitContentMain
              currentItem={currentItem}
              completedItems={completedItems}
              isAccessLoading={isAccessLoading}
              isFirst={isFirst}
              isLast={isLast}
              desktopSidebarOpen={desktopSidebarOpen}
              onMarkComplete={handleMarkComplete}
              onNavigatePrev={handleNavigatePrev}
              onNavigateNext={handleNavigateNext}
              onCompleteLast={handleMarkCompleteAndCelebrate}
            />
          )}
        </main>

        <ToolkitContentSidebar
          items={contentItems}
          currentItemId={currentItem?.id || ""}
          completedItems={completedItems}
          isAccessLoading={isAccessLoading}
          desktopSidebarOpen={desktopSidebarOpen}
          isCommunityActive={activeView === "community"}
          chatUrl={courseChatUrl}
          onItemSelect={handleItemSelect}
          onCommunitySelect={handleCommunitySelect}
        />
      </div>
    </div>
  );
}
