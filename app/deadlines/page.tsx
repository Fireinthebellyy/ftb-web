"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  XCircle,
  CircleQuestionMark,
  CalendarPlus,
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


function handleAddToCalendar(title: string, endDate: string) {
  const date = new Date(endDate);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  
  const allDayDate = `${year}${month}${day}`;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${allDayDate}/${allDayDate}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

type BookmarkItem = {
  title: string;
  description?: string;
  endDate?: string | null;
  daysDiff?: number | null;
  type?: string | string[];
};

function getTypeLabel(type?: string | string[]): string | undefined {
  if (!type) return undefined;
  if (Array.isArray(type)) return type[0];
  return type;
}

function getTypeBadgeClasses(type?: string): string {
  const map: Record<string, string> = {
    hackathon: "bg-blue-100 text-blue-800",
    grant: "bg-green-100 text-green-800",
    competition: "bg-purple-100 text-purple-800",
    ideathon: "bg-orange-100 text-orange-800",
    others: "bg-gray-100 text-gray-800",
  };
  const key = (type || "others").toLowerCase();
  return map[key] || map.others;
}

export default function BookmarksPage() {
  const [upcoming, setUpcoming] = useState<BookmarkItem[]>([]);
  const [closed, setClosed] = useState<BookmarkItem[]>([]);
  const [uncategorized, setUncategorized] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedUpcoming = useMemo(() => {
    return [...upcoming].sort(
      (a, b) =>
        (new Date(a.endDate ?? 0).getTime() || 0) -
        (new Date(b.endDate ?? 0).getTime() || 0)
    );
  }, [upcoming]);

  const memoizedClosed = useMemo(() => {
    return [...closed].sort(
      (a, b) =>
        (new Date(b.endDate ?? 0).getTime() || 0) -
        (new Date(a.endDate ?? 0).getTime() || 0)
    );
  }, [closed]);

  const memoizedUncategorized = useMemo(() => {
    return [...uncategorized].sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );
  }, [uncategorized]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/bookmarks");
        // API returns { upcoming, closed, uncategorized }
        const apiUpcoming: any[] = res.data?.upcoming || [];
        const apiClosed: any[] = res.data?.closed || [];
        const apiUncategorized: any[] = res.data?.uncategorized || [];

        const normalize = (arr: any[]) =>
          arr.map((it) => {
            const endDate = it?.endDate ?? null;
            const daysDiff =
              typeof it?.daysDiff === "number"
                ? it.daysDiff
                : endDate
                  ? differenceInCalendarDays(new Date(endDate), new Date())
                  : null;
            return {
              title: it.title,
              description: it.description,
              type: it.type,
              endDate,
              daysDiff,
            } as BookmarkItem;
          });

        if (mounted) {
          setUpcoming(normalize(apiUpcoming));
          setClosed(normalize(apiClosed));
          setUncategorized(normalize(apiUncategorized));
        }
      } catch (e: any) {
        if (mounted)
          setError(
            e?.response?.status === 401
              ? "unauthorized"
              : e?.message || "Failed to load"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const BookmarkCard = ({ item }: { item: BookmarkItem }) => {
    const typeLabel = getTypeLabel(item.type);
    const noDeadlineText = useMemo(() => {
      const options = ["No deadline", "Needs more info?", "Ask the organiser"];
      const idx = Math.floor(Math.random() * options.length);
      return options[idx];
    }, []);
    return (
      <Card className="py-0">
        <div className="rounded-lg bg-neutral-200 px-[2px] pb-[2px] shadow">
          <p className="flex items-center gap-1 px-2 py-2 text-xs">
            {typeof item.daysDiff === "number" ? (
              item.daysDiff > 0 ? (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{item.daysDiff} days left to apply</span>
                </>
              ) : item.daysDiff === 0 ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  <span>Deadline is today</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-red-600" />
                  <span>Closed {Math.abs(item.daysDiff)} days ago</span>
                </>
              )
            ) : (
              <>
                <CircleQuestionMark className="h-3 w-3" />
                <span>{noDeadlineText}</span>
              </>
            )}
          </p>
          <div className="flex items-center rounded-lg bg-neutral-50 p-2 shadow">
            <div className="w-full">
              <div className="flex items-center justify-between">
                <h3 className="max-w-[60vw] truncate text-base font-semibold text-gray-900 sm:text-lg">
                  {item.title}
                </h3>
                {typeLabel ? (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] sm:text-xs ${getTypeBadgeClasses(typeLabel)} px-2 py-0.5`}
                  >
                    {typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}
                  </Badge>
                ) : null}
              </div>
              {item.endDate && (
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-600 sm:text-sm">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span>
                    {item.endDate
                      ? format(new Date(item.endDate), "MMM dd, yyyy")
                      : null}
                  </span>
                </div>
              )}
              <div className="mt-1 flex items-start justify-between gap-2">
                {item.description && (
                  <p className="line-clamp-2 max-w-[70ch] text-sm text-gray-700">
                    {item.description}
                  </p>
                )}

                {item.endDate && (
                  <button
                    title="Add to calendar"
                    onClick={() => handleAddToCalendar(item.title, item.endDate!)}
                    className="flex-shrink-0 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Add to calendar"
                  >
                    <CalendarPlus className="h-5 w-5" />
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-25 animate-pulse rounded-lg border bg-white p-4"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="mb-4 text-gray-700">
          Please log in to see your deadlines.
        </p>
        <Link
          href="/login"
          className="inline-block rounded bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 text-white"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center text-red-600">
        Failed to load deadlines: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Deadlines</h1>

      <section className="mb-8">
        <h2 className="text-md mb-2 font-semibold text-black">Upcoming</h2>
        {memoizedUpcoming.length ? (
          <div className="space-y-4">
            {memoizedUpcoming.map((item) => (
              <BookmarkCard key={item.title} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No upcoming items</div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-md mb-2 font-semibold text-black">Past</h2>
        {memoizedClosed.length ? (
          <div className="space-y-4">
            {memoizedClosed.map((item) => (
              <BookmarkCard key={item.title} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No closed items</div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-md mb-2 font-semibold text-black">Uncategorized</h2>
        {memoizedUncategorized.length ? (
          <div className="space-y-4">
            {memoizedUncategorized.map((item) => (
              <BookmarkCard key={item.title} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No uncategorized items</div>
        )}
      </section>
    </div>
  );
}