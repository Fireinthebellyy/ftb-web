"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BookmarkItem = {
  title: string;
  description: string;
  endDate: string; 
  daysDiff: number; 
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
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/bookmarks");
        // API now returns { future: BookmarkItem[], past: BookmarkItem[] }
        const futureItems = res.data?.future || [];
        const pastItems = res.data?.past || [];
        const allItems = [...futureItems, ...pastItems];
        if (mounted) setItems(allItems);
      } catch (e: any) {
        if (mounted) setError(e?.response?.status === 401 ? "unauthorized" : e?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const upcoming = useMemo(
    () =>
      items
        .filter((b) => b.daysDiff >= 0)
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
    [items]
  );

  const past = useMemo(
    () =>
      items
        .filter((b) => b.daysDiff < 0)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()),
    [items]
  );

  const DaysBadge = ({ value }: { value: number }) => {
    const abs = Math.abs(value);
    const label = value > 0 ? "days" : value === 0 ? "today" : "days ago";
    return (
      <Badge className="bg-green-700 text-white rounded-full px-3 py-1 min-w-[86px] flex items-center justify-center gap-1">
        {label === "today" ? (
          <span className="text-sm font-semibold">Today</span>
        ) : (
          <>
            <span className="text-lg font-bold leading-none">{abs}</span>
            <span className="text-xs leading-none">{label}</span>
          </>
        )}
      </Badge>
    );
  };

  const BookmarkCard = ({ item }: { item: BookmarkItem }) => {
    const typeLabel = getTypeLabel(item.type);
    return (
      <Card className="py-0">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[60vw]">
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
              <div className="mt-1 text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <span>{format(new Date(item.endDate), "MMM dd, yyyy")}</span>
              </div>
              {item.description ? (
                <p className="mt-1 text-gray-700 text-sm line-clamp-2 max-w-[70ch]">{item.description}</p>
              ) : null}
            </div>
            <DaysBadge value={item.daysDiff} />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 h-25 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <p className="text-gray-700 mb-4">Please log in to see your bookmarks.</p>
        <Link href="/login" className="text-white bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 rounded inline-block">
          Log in
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center text-red-600">
        Failed to load bookmarks: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>

      <section className="mb-8">
        <h2 className="text-md font-semibold text-black mb-2">Future</h2>
        {upcoming.length ? (
          <div className="space-y-4">
            {upcoming.map((item) => (
              <BookmarkCard key={item.title} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No upcoming items</div>
        )}
      </section>

      <section>
        <h2 className="text-md font-semibold text-black mb-2">Past</h2>
        {past.length ? (
          <div className="space-y-4">
            {past.map((item) => (
              <BookmarkCard key={item.title} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No past items</div>
        )}
      </section>
    </div>
  );
}


