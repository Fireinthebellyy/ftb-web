"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Control } from "react-hook-form";
import { InternshipFormData } from "../schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
          name="hiringManagerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hiring Manager Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="manager@company.com"
                  className="focus-visible:ring-1"
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
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Required</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., 6 months, 2 years"
                  className="focus-visible:ring-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internship Duration</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., 3 months, 6 months"
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

      <FormField
        control={control}
        name="deadline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Application Deadline</FormLabel>
            <FormControl>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(new Date(`${field.value}T00:00:00`), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={
                      field.value
                        ? new Date(`${field.value}T00:00:00`)
                        : undefined
                    }
                    onSelect={(d) => {
                      if (!d) return field.onChange("");
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      field.onChange(`${yyyy}-${mm}-${dd}`);
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
