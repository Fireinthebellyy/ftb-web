"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowLeft, Check, ChevronRight } from "lucide-react";
import { ToolkitContentItem } from "@/types/interfaces";
import LessonSidebar from "@/components/toolkit/LessonSidebar";
import VimeoPlayer from "@/components/toolkit/VimeoPlayer";
import MarkdownRenderer from "@/components/toolkit/MarkdownRenderer";
import { useToolkit } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolkitContentPage() {
  const params = useParams();
  const router = useRouter();
  const [currentItem, setCurrentItem] = useState<ToolkitContentItem | null>(
    null
  );
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: toolkitData, isLoading } = useToolkit(params.id as string);

  const toolkit = toolkitData?.toolkit ?? null;
  const contentItems = toolkitData?.contentItems ?? [];
  const hasAccess = toolkitData?.hasPurchased ?? false;

  useEffect(() => {
    if (contentItems.length > 0 && !currentItem) {
      const sortedItems = [...contentItems].sort(
        (a, b) => a.orderIndex - b.orderIndex
      );
      setCurrentItem(sortedItems[0]);
    }
  }, [contentItems, currentItem]);

  if (!isLoading && toolkit && !hasAccess) {
    toast.warning("You need to purchase this toolkit to access content");
    setTimeout(() => {
      router.push(`/toolkit/${params.id}`);
    }, 3000);
  }

  const handleItemSelect = (item: ToolkitContentItem): void => {
    setCurrentItem(item);
    if (!completedItems.includes(item.id)) {
      setCompletedItems((prev) => [...prev, item.id]);
    }
    setSidebarOpen(false);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    if (!currentItem || contentItems.length === 0) return;

    const sortedItems = [...contentItems].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    const currentIndex = sortedItems.findIndex(
      (item) => item.id === currentItem.id
    );

    let newIndex: number;
    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else {
      newIndex =
        currentIndex < sortedItems.length - 1 ? currentIndex + 1 : currentIndex;
    }

    setCurrentItem(sortedItems[newIndex]);
    if (!completedItems.includes(sortedItems[newIndex].id)) {
      setCompletedItems((prev) => [...prev, sortedItems[newIndex].id]);
    }
  };

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

  const sortedItems = [...contentItems].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );
  const currentIndex = currentItem
    ? sortedItems.findIndex((item) => item.id === currentItem.id)
    : -1;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sortedItems.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/toolkit/${toolkit.id}`)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
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

            <div className="min-w-0">
              <p className="truncate text-xs text-gray-500">{toolkit.title}</p>
              <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                {currentItem?.title || "Select a lesson"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-gray-500 sm:inline-block">
              {completedItems.length}/{contentItems.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/toolkit/${toolkit.id}`)}
              className="hidden sm:flex"
            >
              Overview
            </Button>
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-r lg:bg-white">
          <LessonSidebar
            items={contentItems}
            currentItemId={currentItem?.id || ""}
            onItemSelect={handleItemSelect}
            completedItems={completedItems}
          />
        </aside>

        <main className="p-4 sm:p-6 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
          {currentItem ? (
            <div className="mx-auto max-w-3xl space-y-6">
              {currentItem.type === "video" && currentItem.vimeoVideoId && (
                <VimeoPlayer
                  videoId={currentItem.vimeoVideoId}
                  title={currentItem.title}
                  className="shadow-sm"
                />
              )}

              {currentItem.type === "article" && currentItem.content && (
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <MarkdownRenderer
                      content={currentItem.content}
                      protected={true}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleNavigate("prev")}
                  disabled={isFirst}
                  className="w-full sm:w-auto"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  Previous
                </Button>

                {!isLast ? (
                  <Button
                    onClick={() => handleNavigate("next")}
                    className="w-full sm:w-auto"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      toast.success(
                        "Congratulations! You've completed this toolkit!"
                      );
                    }}
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
      </div>
    </div>
  );
}
