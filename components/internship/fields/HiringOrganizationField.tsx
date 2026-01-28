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

export function HiringOrganizationField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="hiringOrganization"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Hiring Organization *</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Company or organization name"
              className="focus-visible:ring-1"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
