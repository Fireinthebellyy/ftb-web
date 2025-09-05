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

type HorizontalCountProgressBarProps = {
  field: {
    value: string;
  };
};

function HorizontalCountProgressBar({
  field,
}: HorizontalCountProgressBarProps) {
  return (
    <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
      <div className="mr-3 flex-1">
        <div
          role="progressbar"
          aria-label="Description length"
          aria-valuemin={0}
          aria-valuemax={2000}
          aria-valuenow={field.value?.length ?? 0}
          className="h-[2px] w-full rounded-full bg-gray-200"
        >
          <div
            className="h-[2px] rounded-full bg-gray-600 transition-all duration-150"
            style={{
              width: `${Math.min(100, ((field.value?.length ?? 0) / 2000) * 100)}%`,
            }}
          />
        </div>
      </div>
      <div className="text-right text-xs text-gray-500 md:w-20">
        {field.value?.length ?? 0} / 2000
      </div>
    </div>
  );
}

export function DescriptionField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div>
              <Textarea
                {...field}
                placeholder="Tell us more about this opportunity... (include URLs if needed) *"
                rows={4}
                className="thin-scrollbar h-[100px] max-h-[300px] resize-none overflow-y-auto border-none px-0 shadow-none placeholder:text-gray-400 focus-visible:ring-0 md:max-h-[200px]"
              />
              <HorizontalCountProgressBar field={field} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
