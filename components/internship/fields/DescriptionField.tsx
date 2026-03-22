"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { InternshipFormData } from "../schema";

type Props = {
  control: Control<InternshipFormData>;
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
    <div className="mt-2 flex items-center justify-end text-sm text-gray-500">
      <div className="text-right text-xs text-gray-500">
        {field.value?.length ?? 0} characters
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
                placeholder="Tell us more about this internship... (include URLs if needed) *"
                rows={4}
                wrap="soft"
                className="thin-scrollbar max-h-[300px] min-h-[100px] resize-none overflow-y-auto overflow-x-hidden break-words md:break-all border-none px-0 pr-2 shadow-none placeholder:text-gray-400 focus-visible:ring-0 md:max-h-[200px]"
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
