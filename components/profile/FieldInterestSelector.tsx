"use client";

import { useMemo, Fragment } from "react";
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
import { domainOptions } from "@/app/onboarding/constants";

type Props = {
  control: Control<any>;
  isEditing: boolean;
};

const PRESET_INTERESTS = [...domainOptions, { id: "Other", label: "Other" }];

export function FieldInterestSelector({ control, isEditing }: Props) {
  const selectableInterests = useMemo(() => PRESET_INTERESTS, []);
  const otherValue = useWatch({ control, name: "fieldInterestOther" }) as
    | string
    | undefined;

  return (
    <FormField
      control={control}
      name="fieldInterests"
      render={({ field }) => {
        const selected = (field.value || []) as string[];
        const presetIds = selectableInterests.map(opt => opt.id);
        const hasCustom = selected.some((v: string) => !presetIds.includes(v));
        // Note: we still check for "Other" in case it's explicitly there
        const isOtherSelected = selected.includes("Other") || hasCustom;

        return (
          <FormItem>
            <FormLabel>Field interest</FormLabel>
            <FormControl>
              {!isEditing ? (
                <div className="flex flex-wrap gap-1 py-1">
                  {selected.length === 0 ? (
                    <div className="py-2 px-3 rounded-md border bg-muted/30 text-sm">—</div>
                  ) : (
                    selected.map((itm: string) => {
                      const opt = selectableInterests.find(o => o.id === itm);
                      return (
                        <Badge
                          key={itm}
                          variant="secondary"
                          className="text-xs px-2 py-0.5 h-auto"
                        >
                          {opt ? opt.label : itm}
                        </Badge>
                      );
                    })
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
                        opt.id === "Other"
                          ? isOtherSelected
                          : selected.includes(opt.id);
                      
                      const showCustomBadge =
                        opt.id === "Other" && isOtherSelected && (otherValue || "").trim().length > 0;

                      return (
                        <Fragment key={opt.id}>
                          {showCustomBadge && (
                            <Badge
                              key={`${opt.id}-custom`}
                              variant="default"
                              className="text-xs px-2 py-0.5 h-auto bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent"
                            >
                              {(otherValue || "").trim()}
                            </Badge>
                          )}
                          <Badge
                            key={opt.id}
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                              "text-xs cursor-pointer transition-all px-2 py-0.5 h-auto",
                              isActive
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent"
                                : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                            )}
                            onClick={() => {
                              const next = isActive
                                ? selected.filter((v: string) => v !== opt.id)
                                : [...selected, opt.id];
                              field.onChange(next);
                            }}
                            role="checkbox"
                            aria-checked={isActive}
                          >
                            {opt.label}
                          </Badge>
                        </Fragment>
                      );
                    })}
                  </div>

                  {isOtherSelected && (
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


