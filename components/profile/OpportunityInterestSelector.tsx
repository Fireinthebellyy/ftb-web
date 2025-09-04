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
import { Control, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";


type Props = {
  control: Control<any>;
  isEditing: boolean;
};

const PRESET_OPP_INTERESTS: string[] = [
  "Hackathons",
  "Grants",
  "Competitions",
  "Ideathons",
  "Internships",
  "Scholarships",
  "Conferences",
  "Other",
];

export default function OpportunityInterestSelector({ control, isEditing }: Props) {
  const selectable = useMemo(() => PRESET_OPP_INTERESTS, []);
  const otherValue = useWatch({ control, name: "opportunityInterestOther" }) as string | undefined;

  return (
    <FormField
      control={control}
      name="opportunityInterests"
      render={({ field }) => {
        const selected = field.value || [];
        const hasCustom = selected.some((v: string) => !selectable.includes(v));
        const hasOther = selected.includes("Other") || hasCustom;

        return (
          <FormItem>
            <FormLabel>Opportunity interest</FormLabel>
            <FormControl>
              {!isEditing ? (
                <div className="flex flex-wrap gap-1 py-1">
                  {selected.length === 0 ? (
                    <div className="py-2 px-3 rounded-md border bg-muted/30 text-sm">—</div>
                  ) : (
                    selected.map((itm: string) => (
                      <Badge key={itm} variant="secondary" className="text-xs px-2 py-0.5 h-auto">
                        {itm}
                      </Badge>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="Select your opportunity interests">
                    {selectable.map((opt) => {
                      const isActive =
                        opt === "Other"
                          ? selected.includes("Other") || hasCustom
                          : selected.includes(opt);
                      const showCustomBadge =
                        opt === "Other" && (selected.includes("Other") || hasCustom) && (otherValue || "").trim().length > 0;

                      return (
                        <>
                          {showCustomBadge && (
                            <Badge
                              key={`${opt}-custom`}
                              variant="default"
                              className="text-xs px-2 py-0.5 h-auto bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent"
                            >
                              {(otherValue || "").trim()}
                            </Badge>
                          )}
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
                        </>
                      );
                    })}
                  </div>

                  {hasOther && (
                    <FormField
                      control={control}
                      name="opportunityInterestOther"
                      render={({ field: otherField }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">If Other, please specify</FormLabel>
                          <FormControl>
                            <Input placeholder="Type your interest" {...otherField} aria-label="Other opportunity interest" />
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


