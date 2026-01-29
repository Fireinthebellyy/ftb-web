"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export function OptionCard({
  title,
  description,
  selected,
  onClick,
  disabled,
  onKeyDown,
  autoFocus,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled}
      autoFocus={autoFocus}
      className={cn(
        "w-full rounded-xl border bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-orange-300 ring-2 ring-orange-200"
          : "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-gray-900">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        {selected && (
          <span className="rounded-full bg-orange-100 p-1 text-orange-600">
            <Check className="h-4 w-4" />
          </span>
        )}
      </div>
    </button>
  );
}
