"use client";

import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import { InternshipFormData } from "../schema";
import { internshipFields } from "../constants";

type Props = {
  control: Control<InternshipFormData>;
  value: string | undefined;
  onChange: (v: string) => void;
  isRequired?: boolean;
};

export function FieldSelector({ control, value, onChange, isRequired = false }: Props) {
  return (
    <FormField
      control={control}
      name="field"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Primary Field Domain {isRequired && "*"}</FormLabel>
          <FormControl>
            <div
              className="flex items-center gap-1.5 flex-wrap"
              role="radiogroup"
              aria-label="Primary Field Domain"
            >
              {internshipFields.map((item) => (
                <Badge
                  key={item.id}
                  variant={value === item.id ? "default" : "outline"}
                  className={cn(
                    "text-[10px] sm:text-xs cursor-pointer transition-all px-2.5 py-1 h-auto rounded-full font-medium",
                    value === item.id
                      ? "bg-[#ec5b13] text-white hover:bg-orange-600 border-transparent shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                  )}
                  onClick={() => {
                    onChange(item.id);
                    field.onChange(item.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange(item.id);
                      field.onChange(item.id);
                    }
                  }}
                  role="radio"
                  aria-checked={value === item.id}
                  tabIndex={0}
                >
                  {item.label}
                </Badge>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
