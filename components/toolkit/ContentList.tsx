"use client";

import React from "react";
import { FileText, Video, Lock, Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ToolkitContentItem } from "@/types/interfaces";

interface ContentListProps {
  items: ToolkitContentItem[];
  hasPurchased: boolean;
  onItemClick?: (item: ToolkitContentItem) => void;
  className?: string;
}

export default function ContentList({
  items,
  hasPurchased,
  onItemClick,
  className,
}: ContentListProps) {
  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);
  const mixedItems = sortedItems.filter(
    (item) =>
      Boolean(item.bunnyVideoUrl?.trim()) && Boolean(item.content?.trim())
  );
  const videoItems = sortedItems.filter(
    (item) =>
      Boolean(item.bunnyVideoUrl?.trim()) && !Boolean(item.content?.trim())
  );
  const articleItems = sortedItems.filter(
    (item) =>
      Boolean(item.content?.trim()) && !Boolean(item.bunnyVideoUrl?.trim())
  );
  const groupedItemIds = new Set([
    ...mixedItems.map((item) => item.id),
    ...videoItems.map((item) => item.id),
    ...articleItems.map((item) => item.id),
  ]);
  const otherItems = sortedItems.filter((item) => !groupedItemIds.has(item.id));

  const renderContentItem = (item: ToolkitContentItem) => {
    const isLocked = !hasPurchased;
    const hasVideo = Boolean(item.bunnyVideoUrl?.trim());
    const hasArticle = Boolean(item.content?.trim());
    const lessonTypeLabel =
      hasArticle && hasVideo
        ? "article + video"
        : hasVideo
          ? "video"
          : hasArticle
            ? "article"
            : "other";

    return (
      <div
        key={item.id}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
          !isLocked && "cursor-pointer hover:bg-orange-50",
          isLocked && "cursor-not-allowed opacity-60"
        )}
        onClick={() => !isLocked && onItemClick?.(item)}
      >
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
            hasVideo ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
          )}
        >
          {isLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <>
              {hasVideo ? (
                <Video className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {item.title}
          </p>
          <p className="text-xs text-gray-500 capitalize">{lessonTypeLabel}</p>
        </div>

        {hasPurchased && <Check className="h-4 w-4 text-green-500 opacity-0" />}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <FileText className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">No content available yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-gray-900">
        What You&apos;ll Learn
      </h3>

      {sortedItems.length <= 8 ? (
        <div className="space-y-1">
          {sortedItems.map((item) => renderContentItem(item))}
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {mixedItems.length > 0 && (
            <AccordionItem value="mixed">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-red-600" />
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Article + Video ({mixedItems.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  {mixedItems.map((item) => renderContentItem(item))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {videoItems.length > 0 && (
            <AccordionItem value="videos">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-red-600" />
                  <span>Videos ({videoItems.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  {videoItems.map((item) => renderContentItem(item))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {articleItems.length > 0 && (
            <AccordionItem value="articles">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Articles ({articleItems.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  {articleItems.map((item) => renderContentItem(item))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {otherItems.length > 0 && (
            <AccordionItem value="other">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>Other ({otherItems.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  {otherItems.map((item) => renderContentItem(item))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  );
}
