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

  const hasInitialForCurrentMonth =
    monthKey === initialMonthKey && Array.isArray(initialBookmarkedDates);

  const {
    data: bookmarkedDates = [],
    isLoading,
    error,
  } = useBookmarkDatesForMonth(monthKey, {
    enabled: queryEnabled && !hasInitialForCurrentMonth,
    initialData:
      monthKey === initialMonthKey ? initialBookmarkedDates : undefined,
  });

  const dates = useMemo(() => {
    return bookmarkedDates.map((d) => {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day, 12, 0, 0);
    });
  }, [bookmarkedDates]);



  const handleSelect = (dates: Date[] | undefined) => {
    if (dates && dates.length > 0) {
      router.push("/deadlines");
    }
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
          components={{
            DayButton: ({ day, ...props }) => {
              const isSelected = dates.some(d =>
                d.getDate() === day.date.getDate() &&
                d.getMonth() === day.date.getMonth() &&
                d.getFullYear() === day.date.getFullYear()
              );

              // Find the bookmark data for this date to count the rings
              // Use local date components to avoid timezone issues
              const year = day.date.getFullYear();
              const month = String(day.date.getMonth() + 1).padStart(2, '0');
              const dayNum = String(day.date.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${dayNum}`;
              const isBookmarked = bookmarkedDates.includes(dateStr);
              const ringsCount = isBookmarked ? 1 : 0;



              return (
                <div className="relative flex w-full h-full items-center justify-center">
                  <button
                    {...props}
                    onClick={() => handleSelect([day.date])}
                    className={`relative flex items-center justify-center w-full h-full rounded-full transition-colors hover:bg-gray-100 ${
                      isSelected
                        ? 'border-2 border-orange-500 bg-orange-50'
                        : 'text-gray-900'
                    }`}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      boxShadow: isSelected ? '0 0 0 1px rgba(249, 115, 22, 0.5)' : undefined,
                    }}
                  >
                    {/* Render ring if bookmarked */}
                    {ringsCount > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="absolute w-[26px] h-[26px] border-2 border-orange-400 rounded-full"></div>
                      </div>
                    )}
                    <span className={`text-sm relative z-10 ${isSelected ? 'font-semibold text-orange-700' : ''}`}>
                      {day.date.getDate()}
                    </span>
                  </button>
                </div>
              );
            }
          }}
        />
      </div>
    </div>
  );
});

export default CalendarWidget;
