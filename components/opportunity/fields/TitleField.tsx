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

export function TitleField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Textarea
              {...field}
              placeholder="What's the opportunity about? (Title) *"
              rows={1}
              className="text-lg md:text-xl font-medium border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 shadow-none resize-none min-h-[40px] overflow-hidden"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
