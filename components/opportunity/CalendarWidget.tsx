"use client";
import { memo, useMemo, useState } from "react";
import { Calendar } from "../ui/calendar";
import { useBookmarkDatesForMonth } from "@/lib/queries-opportunities";
import { Loader2 } from "lucide-react"; // or your preferred loading icon
import { useRouter } from "next/navigation";

interface CalendarWidgetProps {
  queryEnabled?: boolean;
  initialMonthKey?: string;
  initialBookmarkedDates?: string[];
}

const CalendarWidget = memo(function CalendarWidget({
  queryEnabled = true,
  initialMonthKey,
  initialBookmarkedDates,
}: CalendarWidgetProps) {
  const router = useRouter();
  const [month, setMonth] = useState<Date>(() => new Date());

  const monthKey = useMemo(() => {
    const y = month.getFullYear();
    const m = String(month.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [month]);

  const {
    data: bookmarkedDates = [],
    isLoading,
    error,
  } = useBookmarkDatesForMonth(monthKey, {
    enabled: queryEnabled,
    initialData:
      monthKey === initialMonthKey ? initialBookmarkedDates : undefined,
  });

  const dates = useMemo(() => {
    return bookmarkedDates.map((d) => {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day, 12, 0, 0);
    });
  }, [bookmarkedDates]);

  const handleSelect = () => {
    router.push("/bookmarks");
  };

  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Upcoming Deadlines</h3>
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        )}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
          Failed to load bookmark dates. Please try again.
        </div>
      )}

      <div className="w-full">
        <Calendar
          className="w-full"
          month={month}
          onMonthChange={setMonth}
          mode="multiple"
          selected={dates}
          onSelect={handleSelect}
          aria-label="Opportunity deadlines calendar"
          disabled={isLoading}
        />
      </div>
    </div>
  );
});

export default CalendarWidget;
