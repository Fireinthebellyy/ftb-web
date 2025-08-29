"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { cn } from "@/lib/utils";

type Props = {
  control: Control<any>;
  isEditing: boolean;
};

const PRESET_INTERESTS: string[] = [
  "AI/ML",
  "Web Development",
  "App Development",
  "Blockchain",
  "Cybersecurity",
  "Data Science",
  "Product",
  "Design/UI-UX",
  "Open Source",
  "Entrepreneurship",
  "Other",
];

export function FieldInterestSelector({ control, isEditing }: Props) {
  const selectableInterests = useMemo(() => PRESET_INTERESTS, []);

  return (
    <FormField
      control={control}
      name="fieldInterests"
      render={({ field }) => {
        const selected = field.value || [];
        const hasCustom = selected.some((v: string) => !selectableInterests.includes(v));
        const hasOther = selected.includes("Other") || hasCustom;

        return (
          <FormItem>
            <FormLabel>Field interest</FormLabel>
            <FormControl>
              {!isEditing ? (
                <div className="flex flex-wrap gap-1 py-1">
                  {selected.length === 0 ? (
                    <div className="py-2 px-3 rounded-md border bg-muted/30 text-sm">—</div>
                  ) : (
                    selected.map((itm: string) => (
                      <Badge
                        key={itm}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 h-auto"
                      >
                        {itm}
                      </Badge>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-1 flex-wrap"
                    role="group"
                    aria-label="Select your field interests"
                  >
                    {selectableInterests.map((opt) => {
                      const isActive =
                        opt === "Other"
                          ? selected.includes("Other") || hasCustom
                          : selected.includes(opt);
                      return (
                        <Badge
                          key={opt}
                          variant={isActive ? "default" : "outline"}
                          className={cn(
                            "text-xs cursor-pointer transition-all px-2 py-0.5 h-auto",
                            isActive
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                          )}
                          onClick={() => {
                            const next = isActive
                              ? selected.filter((s: string) => s !== opt)
                              : [...selected, opt];
                            field.onChange(next);
                          }}
                          role="checkbox"
                          aria-checked={isActive}
                        >
                          {opt}
                        </Badge>
                      );
                    })}
                  </div>

                  {hasOther && (
                    <FormField
                      control={control}
                      name="fieldInterestOther"
                      render={({ field: otherField }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            If Other, please specify
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Type your interest"
                              {...otherField}
                              aria-label="Other field interest"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default FieldInterestSelector;


