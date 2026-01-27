"use client";

interface SummaryItemProps {
  title: string;
  value: string;
}

export function SummaryItem({ title, value }: SummaryItemProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-muted-foreground text-xs">{title}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
