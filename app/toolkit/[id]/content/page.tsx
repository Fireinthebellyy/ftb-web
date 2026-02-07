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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  PanelRight,
  ArrowLeft,
  Check,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolkitContentItem } from "@/types/interfaces";
import LessonSidebar from "@/components/toolkit/LessonSidebar";
import BunnyPlayer from "@/components/toolkit/BunnyPlayer";
import HtmlRenderer from "@/components/toolkit/HtmlRenderer";
import { useToolkit, useMarkContentComplete } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data: toolkitData, isLoading } = useToolkit(toolkitId);
  const markComplete = useMarkContentComplete(toolkitId);

  const toolkit = toolkitData?.toolkit ?? null;
  const contentItems = useMemo(
    () => toolkitData?.contentItems ?? [],
    [toolkitData?.contentItems]
  );
  const hasAccess = toolkitData?.hasPurchased ?? false;
  // Use completedItemIds from API (persisted in DB)
  const completedItems = useMemo(
    () => toolkitData?.completedItemIds ?? [],
    [toolkitData?.completedItemIds]
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
    if (!isLoading && toolkit && !hasAccess && !didRedirectRef.current) {
      didRedirectRef.current = true;
      toast.warning("You need to purchase this toolkit to access content");
      const timeoutId = setTimeout(() => {
        router.push(`/toolkit/${params.id}`);
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, hasAccess, toolkit, params.id, router]);

  const handleItemSelect = useCallback((item: ToolkitContentItem): void => {
    setCurrentItem(item);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!toolkit || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-bold">Access Denied</h2>
            <p className="mb-4 text-sm text-gray-600">
              You need to purchase this toolkit to access the content.
            </p>
            <Button onClick={() => router.push("/toolkit")} className="w-full">
              Back to Toolkits
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
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
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
                {currentItem?.title || "Select a lesson"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 lg:hidden"
                >
                  <PanelRight className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <LessonSidebar
                  items={contentItems}
                  currentItemId={currentItem?.id || ""}
                  onItemSelect={handleItemSelect}
                  completedItems={completedItems}
                />
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
          {currentItem ? (
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
                      onComplete={handleMarkComplete}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  onClick={handleNavigatePrev}
                  disabled={isFirst}
                  className="w-full sm:w-auto"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  Previous
                </Button>

                {!isLast ? (
                  <Button
                    onClick={handleNavigateNext}
                    className="w-full sm:w-auto"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleMarkCompleteAndCelebrate}
                    className="w-full sm:w-auto"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-center">
              <p className="text-sm text-gray-500">
                No content available for this toolkit yet.
              </p>
            </div>
          )}
        </main>

        <aside
          className={cn(
            "hidden w-72 shrink-0 lg:order-last lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-l lg:bg-white",
            !desktopSidebarOpen && "lg:hidden"
          )}
        >
          <LessonSidebar
            items={contentItems}
            currentItemId={currentItem?.id || ""}
            onItemSelect={handleItemSelect}
            completedItems={completedItems}
          />
        </aside>
      </div>
    </div>
  );
}
