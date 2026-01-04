"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: toolkitData, isLoading } = useToolkit(params.id as string);

  const toolkit = toolkitData?.toolkit ?? null;
  const contentItems = toolkitData?.contentItems ?? [];
  const hasAccess = toolkitData?.hasPurchased ?? false;

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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-72 space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!toolkit || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">Access Denied</h2>
          <p className="mb-6 text-gray-600">
            You need to purchase this toolkit to access the content.
          </p>
          <Button onClick={() => router.push("/toolkit")}>
            Back to Toolkits
          </Button>
        </div>
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
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="w-72 flex-shrink-0 border-r bg-white">
          <LessonSidebar
            items={contentItems}
            currentItemId={currentItem?.id || ""}
            onItemSelect={handleItemSelect}
            completedItems={completedItems}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
            <div>
              <p className="text-sm text-gray-500">{toolkit.title}</p>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentItem?.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {completedItems.length} / {contentItems.length} completed
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/toolkit/${toolkit.id}`)}
            >
              Overview
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-8">
          {currentItem && (
            <>
              <div className="mb-8">
                {currentItem.type === "video" && currentItem.vimeoVideoId && (
                  <VimeoPlayer
                    videoId={currentItem.vimeoVideoId}
                    title={currentItem.title}
                    className="shadow-xl"
                  />
                )}

                {currentItem.type === "article" && currentItem.content && (
                  <div className="rounded-2xl bg-white p-8 shadow-sm">
                    <MarkdownRenderer
                      content={currentItem.content}
                      protected={true}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => handleNavigate("prev")}
                  disabled={isFirst}
                >
                  ← Previous
                </Button>

                {!isLast && (
                  <Button
                    onClick={() => handleNavigate("next")}
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Next →
                  </Button>
                )}

                {isLast && (
                  <Button
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      toast.success(
                        "Congratulations! You've completed this toolkit!"
                      );
                    }}
                  >
                    Complete ✓
                  </Button>
                )}
              </div>
            </>
          )}

          {!currentItem && contentItems.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-500">
                No content available for this toolkit yet.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
