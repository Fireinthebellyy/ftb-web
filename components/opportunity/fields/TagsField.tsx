"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Hash } from "lucide-react";
import { Control } from "react-hook-form";
import { FormData } from "../schema";

type Props = {
  control: Control<FormData>;
};

export function TagsField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="tags"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="flex items-center gap-2 pt-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <Input
                {...field}
                placeholder="Add tags (ai, blockchain, web3...)"
                className="border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 text-sm shadow-none"
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
