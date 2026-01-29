"use client";

import { Badge } from "@/components/ui/badge";

interface SummaryListProps {
  title: string;
  items: string[];
}

export function SummaryList({ title, items }: SummaryListProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-muted-foreground text-xs">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-muted-foreground text-xs">Not set</span>
        ) : (
          items.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="bg-orange-50 text-orange-700"
            >
              {item}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
