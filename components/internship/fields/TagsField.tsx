"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { InternshipFormData } from "../schema";
import { Hash } from "lucide-react";

type Props = {
  control: Control<InternshipFormData>;
};

export function TagsField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="tags"
      render={({ field }) => (
        <FormItem>
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-1">
              <Hash
                className="w-3.5 h-3.5 text-gray-400"
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-gray-400">
                Tags (comma-separated)
              </span>
            </div>

            <FormControl>
              <Input
                {...field}
                placeholder="javascript, react, frontend, etc."
                className="focus-visible:ring-1"
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
