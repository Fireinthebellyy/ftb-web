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
              className="thin-scrollbar max-h-[300px] resize-none overflow-y-auto border-none px-0 shadow-none placeholder:text-gray-400 focus-visible:ring-0 md:max-h-[200px]"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
