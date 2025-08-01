"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { FormData } from "../schema";

type Props = {
  control: Control<FormData>;
};

export function DescriptionField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Tell us more about this opportunity... (include URLs if needed) *"
              rows={4}
              className="resize-none border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 shadow-none"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
