"use client";

import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Tags } from "lucide-react";
import { Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FormData } from "../schema";
import { opportunityTypes } from "../constants";

type Props = {
  control: Control<FormData>;
  value: string | undefined;
  onChange: (v: string) => void;
};

export function TypeSelector({ control, value, onChange }: Props) {
  return (
    <FormField
      control={control}
      name="type"
      render={() => (
        <FormItem>
          <FormControl>
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-1">
                <Tags
                  className="w-3.5 h-3.5 text-gray-400"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-gray-400">
                  Opportunity type
                  <span className="ml-0.5">*</span>
                </span>
              </div>

              <div
                className="flex items-center gap-1 flex-wrap"
                role="radiogroup"
                aria-label="Opportunity type"
              >
                {opportunityTypes.map((type) => (
                  <Badge
                    key={type.id}
                    variant={value === type.id ? "default" : "outline"}
                    className={cn(
                      "text-xs cursor-pointer transition-all px-2 py-0.5 h-auto",
                      value === type.id
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                    )}
                    onClick={() => onChange(type.id)}
                    role="radio"
                    aria-checked={value === type.id}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
