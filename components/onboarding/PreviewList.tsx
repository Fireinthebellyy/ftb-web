"use client";

import { Badge } from "@/components/ui/badge";

interface PreviewListProps {
  label: string;
  items: string[];
}

export function PreviewList({ label, items }: PreviewListProps) {
  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-muted-foreground text-xs">--</span>
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
