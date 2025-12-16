"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { InternshipFormData } from "../schema";

type Props = {
  control: Control<InternshipFormData>;
};

export function MetaFields({ control }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="City, Country"
                  className="focus-visible:ring-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="stipend"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stipend (₹)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="Monthly stipend amount"
                  className="focus-visible:ring-1"
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="hiringManager"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hiring Manager</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Contact person name"
                  className="focus-visible:ring-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application Link</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://..."
                  className="focus-visible:ring-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="deadline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Application Deadline</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="date"
                className="focus-visible:ring-1"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
