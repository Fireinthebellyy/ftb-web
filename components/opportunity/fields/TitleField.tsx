"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control, useWatch } from "react-hook-form";
import { FormData } from "../schema";

type Props = {
  control: Control<FormData>;
};

export function TitleField({ control }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleValue = useWatch({ control, name: "title" });

  const adjustTextareaHeight = useCallback((elem: HTMLTextAreaElement) => {
    elem.style.height = "auto";
    elem.style.height = `${elem.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [titleValue, adjustTextareaHeight]);

  return (
    <FormField
      control={control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Textarea
              {...field}
              ref={(e) => {
                field.ref(e);
                textareaRef.current = e;
              }}
              placeholder="What's the opportunity about? (Title) *"
              rows={1}
              className="text-lg md:text-xl font-medium border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 shadow-none resize-none min-h-[40px] overflow-hidden"
              onInput={(e: React.FormEvent<HTMLTextAreaElement>) =>
                adjustTextareaHeight(e.currentTarget)
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
