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
  isRequired?: boolean;
};

export function TimingSelector({ control, value, onChange, isRequired = true }: Props) {
  return (
    <FormField
      control={control}
      name="timing"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Internship Timing {isRequired && "*"}</FormLabel>
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
                      "text-[10px] sm:text-xs cursor-pointer transition-all px-2.5 py-1 h-auto rounded-full font-medium",
                      value === timing.id
                        ? "bg-orange-500 text-white hover:bg-orange-600 border-transparent shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                    )}
                    onClick={() => {
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