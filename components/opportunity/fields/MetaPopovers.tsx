"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, MapPin, Building2, X, Flag } from "lucide-react";
import { Control } from "react-hook-form";
import { FormData } from "../schema";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type Props = {
  control: Control<FormData>;
  watchedLocation?: string | null;
  watchedOrganiser?: string | null;
  watchedDateRange?: { from?: Date; to?: Date } | undefined;
};

export function MetaPopovers({
  control,
  watchedLocation,
  watchedOrganiser,
  watchedDateRange,
}: Props) {
  return (
    <div className="flex items-center gap-4">
      {/* Location */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "p-2 h-8 w-8",
              watchedLocation && "text-blue-600 bg-blue-50"
            )}
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <FormField
            control={control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      {...field}
                      placeholder="City, Country"
                      className="text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </PopoverContent>
      </Popover>

      {/* Organizer */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "p-2 h-8 w-8",
              watchedOrganiser && "text-blue-600 bg-blue-50"
            )}
          >
            <Building2 className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <FormField
            control={control}
            name="organiserInfo"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organizer</label>
                    <Input
                      {...field}
                      placeholder="Company or Organization"
                      className="text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </PopoverContent>
      </Popover>

      {/* Calendar with Date Range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "p-2 h-8 w-8",
              watchedDateRange && "text-blue-600 bg-blue-50"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <FormField
            control={control}
            name="dateRange"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div>
                    <Calendar
                      mode="range"
                      selected={field.value as DateRange}
                      onSelect={field.onChange}
                      captionLayout={"dropdown-months"}
                      numberOfMonths={1}
                    />
                    {field.value?.from && (
                      <div className="p-3 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Selected Dates
                            {field.value.to && (
                              <span className="text-xs ml-1">
                                (
                                {Math.ceil(
                                  (field.value.to.getTime() -
                                    field.value.from.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                ) + 1}{" "}
                                days)
                              </span>
                            )}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange(undefined)}
                            className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 flex items-center"
                          >
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {format(field.value.from, "MMM dd, yyyy")}
                          </Badge>

                          {field.value.to && (
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-800 flex items-center"
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              {format(field.value.to, "MMM dd, yyyy")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
