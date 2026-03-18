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
import { internshipTypes } from "../constants";

type Props = {
  control: Control<InternshipFormData>;
  value: "onsite" | "remote" | "hybrid" | undefined;
  onChange: (v: "onsite" | "remote" | "hybrid") => void;
};

export function TypeSelector({ control, value, onChange }: Props) {
  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Internship Type *</FormLabel>
          <FormControl>
            <div
              className="flex items-center gap-1 flex-wrap"
              role="radiogroup"
              aria-label="Internship type"
            >
                {internshipTypes.map((type) => (
                  <Badge
                    key={type.id}
                    variant={value === type.id ? "default" : "outline"}
                    className={cn(
                      "text-xs cursor-pointer transition-all px-2 py-0.5 h-auto",
                      value === type.id
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                    )}
                    onClick={() => {
                      onChange(type.id as "onsite" | "remote" | "hybrid");
                      field.onChange(type.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onChange(type.id as "onsite" | "remote" | "hybrid");
                        field.onChange(type.id);
                      }
                    }}
                    role="radio"
                    aria-checked={value === type.id}
                    tabIndex={0}
                  >
                    {type.label}
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
