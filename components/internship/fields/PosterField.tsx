"use client";

import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { InternshipFormData } from "../schema";

type Props = {
  control: Control<InternshipFormData>;
};

export function PosterField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="poster"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Poster Image URL (Optional)</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="https://example.com/image.jpg"
              className="focus-visible:ring-1"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
