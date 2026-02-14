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

type Props = {
  control: Control<InternshipFormData>;
};

export function TitleField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input
              {...field}
              placeholder="What's the internship title? *"
              className="text-xl md:text-xl font-medium border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 shadow-none"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
