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
import { internshipTimings } from "../constants";

type Props = {
  control: Control<InternshipFormData>;
  value: "full_time" | "part_time" | undefined;
  onChange: (v: "full_time" | "part_time") => void;
};

export function TimingSelector({ control, value, onChange }: Props) {
  return (
    <FormField
      control={control}
      name="timing"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Internship Timing *</FormLabel>
          <FormControl>
            <div
              className="flex items-center gap-1 flex-wrap"
              role="radiogroup"
              aria-label="Internship timing"
            >
                {internshipTimings.map((timing) => (
                  <Badge
                    key={timing.id}
                    variant={value === timing.id ? "default" : "outline"}
                    className={cn(
                      "text-xs cursor-pointer transition-all px-2 py-0.5 h-auto",
                      value === timing.id
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                    )}
                    onClick={() => {
                      onChange(timing.id as "full_time" | "part_time");
                      field.onChange(timing.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onChange(timing.id as "full_time" | "part_time");
                        field.onChange(timing.id);
                      }
                    }}
                    tabIndex={0}
                    role="radio"
                    aria-checked={value === timing.id}
                  >
                    {timing.label}
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
