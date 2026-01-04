"use client";

import React from "react";
import { FileText, Video, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolkitContentItem } from "@/types/interfaces";

interface LessonNavigationProps {
  items: ToolkitContentItem[];
  currentItemId: string;
  onItemSelect: (item: ToolkitContentItem) => void;
  completedItems?: string[];
  className?: string;
}

export default function LessonNavigation({
  items,
  currentItemId,
  onItemSelect,
  completedItems = [],
  className,
}: LessonNavigationProps) {
  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <nav className={cn("flex h-full flex-col border-r bg-white", className)}>
      <div className="border-b p-4">
        <h3 className="font-semibold text-gray-900">Course Content</h3>
        <p className="text-sm text-gray-500">
          {items.length} lessons •{" "}
          {
            sortedItems.filter((item) => completedItems.includes(item.id))
              .length
          }{" "}
          completed
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {sortedItems.map((item) => {
            const isActive = item.id === currentItemId;
            const isCompleted = completedItems.includes(item.id);

            return (
              <li key={item.id}>
                <button
                  onClick={() => onItemSelect(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                    isActive
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
                      isActive
                        ? "bg-orange-500 text-white"
                        : item.type === "video"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : item.type === "video" ? (
                      <Video className="h-3.5 w-3.5" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        isActive && "font-semibold"
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {item.type}
                    </p>
                  </div>

                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
