"use client";

import { format } from "date-fns";
import { useBookmarks } from "@/lib/queries";

export default function DeadlinesWidget() {
  const { data: bookmarks = [], isLoading } = useBookmarks();

  // Filter bookmarks that have deadlines
  const deadlineBookmarks = bookmarks.filter(
    (bookmark) => bookmark.opportunity?.deadline
  );

  // Sort by deadline (closest first)
  const sortedDeadlines = deadlineBookmarks
    .sort((a, b) => {
      const dateA = new Date(a.opportunity.deadline);
      const dateB = new Date(b.opportunity.deadline);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5); // Show only first 5

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white px-4 py-3">
        <h3 className="mb-3 font-semibold text-gray-900">Deadlines</h3>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <h3 className="mb-3 font-semibold text-gray-900">Deadlines</h3>
      {sortedDeadlines.length > 0 ? (
        <div className="space-y-2">
          {sortedDeadlines.map((bookmark) => (
            <div
              key={bookmark.bookmarkId}
              className="flex items-center justify-between rounded bg-gray-50 p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {bookmark.opportunity.title}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(bookmark.opportunity.deadline), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No deadlines found</p>
      )}
    </div>
  );
}
