"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectableButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function SelectableButton({
  label,
  selected,
  onClick,
  icon,
  disabled,
  onKeyDown,
}: SelectableButtonProps) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      className={cn(
        "justify-between text-left transition-all",
        selected && "border-orange-200 shadow-sm"
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled}
    >
      <span className="font-medium">{label}</span>
      {icon}
    </Button>
  );
}
