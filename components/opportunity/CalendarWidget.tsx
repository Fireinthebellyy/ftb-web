"use client";
import { memo, useMemo, useState } from "react";
import { Calendar } from "../ui/calendar";
import { useRouter } from "next/navigation";
import { useTracker } from "@/components/providers/TrackerProvider";

interface CalendarWidgetProps {
  queryEnabled?: boolean;
  initialMonthKey?: string;
  initialBookmarkedDates?: string[];
}

const CalendarWidget = memo(function CalendarWidget({ }: CalendarWidgetProps) {
  const router = useRouter();
  const { items } = useTracker();
  const [month, setMonth] = useState<Date>(() => new Date());

  // Build a set of highlighted dates from tracker deadlines
  const dates = useMemo(() => {
    return items
      .filter((item) => item.deadline)
      .map((item) => {
        const [y, m, day] = item.deadline!.split("-").map(Number);
        return new Date(y, m - 1, day, 12, 0, 0);
      });
  }, [items]);

  const handleSelect = () => {
    router.push("/tracker?tab=opportunity");
  };

  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Upcoming Deadlines</h3>
      </div>

      <div className="w-full">
        <Calendar
          className="w-full"
          month={month}
          onMonthChange={setMonth}
          mode="multiple"
          selected={dates}
          onSelect={handleSelect}
          aria-label="Opportunity deadlines calendar"
        />
      </div>
    </div>
  );
});

export default CalendarWidget;
