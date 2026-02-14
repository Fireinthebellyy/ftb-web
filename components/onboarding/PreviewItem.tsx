"use client";

interface PreviewItemProps {
  label: string;
  value: string;
}

export function PreviewItem({ label, value }: PreviewItemProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
