"use client";

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

const ROLE_OPTIONS = [
  "College Student",
  "School Student",
  "Junior Professional",
  "Senior Professional",
  "Other",
];

export default function CurrentRoleSelector({ control, isEditing }: Props) {
  const otherValue = useWatch({ control, name: "currentRoleOther" }) as string | undefined;
  return (
    <FormField
      control={control}
      name="currentRole"
      render={({ field }) => {
        const selected = field.value || "";
        const isCustom = selected && !ROLE_OPTIONS.includes(selected);
        const displayRole = selected === "Other" ? (otherValue || "").trim() : selected;

        return (
          <FormItem>
            <FormLabel>I am currently a</FormLabel>
            <FormControl>
              {!isEditing ? (
                <div className="flex flex-wrap gap-1 py-1">
                  {displayRole ? (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 h-auto">
                      {displayRole}
                    </Badge>
                  ) : (
                    <div className="py-2 px-3 rounded-md border bg-muted/30 text-sm">—</div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <FormField
                    control={control}
                    name="currentRoleOther"
                    render={({ field: otherField }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Type your role"
                            value={selected === "Other" ? otherField.value || "" : displayRole || ""}
                            onChange={(e) => {
                              if (selected === "Other") otherField.onChange(e.target.value);
                            }}
                            readOnly={selected !== "Other"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-1 flex-wrap" role="radiogroup" aria-label="Current role">
                    {ROLE_OPTIONS.map((opt) => {
                      const isActive =
                        opt === "Other" ? selected === "Other" || isCustom : selected === opt;
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
                          onClick={() => field.onChange(opt)}
                          role="radio"
                          aria-checked={isActive}
                        >
                          {opt}
                        </Badge>
                      );
                    })}
                  </div>
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


