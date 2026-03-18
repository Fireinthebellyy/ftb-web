"use client";
import { memo, useMemo, useState } from "react";
import { Calendar } from "../ui/calendar";
import { useRouter } from "next/navigation";
import { TrackerKind, useTrackerDeadlineCounts } from "@/lib/queries";

interface CalendarWidgetProps {
  kind?: TrackerKind;
  title?: string;
  trackerTab?: TrackerKind;
  queryEnabled?: boolean;
  initialMonthKey?: string;
  initialBookmarkedDates?: string[];
}

const CalendarWidget = memo(function CalendarWidget({
  kind = "opportunity",
  title,
  trackerTab,
  queryEnabled = true,
}: CalendarWidgetProps) {
  const router = useRouter();
  const [month, setMonth] = useState<Date>(() => new Date());
  const activeTrackerTab = trackerTab ?? kind;
  const heading =
    title ?? (kind === "internship" ? "Upcoming Internships" : "Upcoming Opportunities");
  const { data } = useTrackerDeadlineCounts(kind, queryEnabled);
  const deadlineCounts = useMemo(
    () => data?.deadlineCounts || {},
    [data?.deadlineCounts]
  );

  const { dates, count1, count2, count3plus } = useMemo(() => {
    const allDates: Date[] = [];
    const c1: Date[] = [];
    const c2: Date[] = [];
    const c3: Date[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const [dateStr, count] of Object.entries(deadlineCounts)) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d, 12, 0, 0);
      if (date < todayStart) {
        continue;
      }
      allDates.push(date);
      if (count === 1) c1.push(date);
      else if (count === 2) c2.push(date);
      else c3.push(date);
    }

    return { dates: allDates, count1: c1, count2: c2, count3plus: c3 };
  }, [deadlineCounts]);

  const handleSelect = () => {
    router.push(`/tracker?tab=${activeTrackerTab}`);
  };

  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{heading}</h3>
      </div>

      <div className="w-full">
        <Calendar
          className="w-full"
          month={month}
          onMonthChange={setMonth}
          mode="multiple"
          selected={dates}
          modifiers={{ count1, count2, count3plus }}
          onSelect={handleSelect}
          aria-label={`${kind} deadlines calendar`}
        />
      </div>
    </div>
  );
});

export default CalendarWidget;
