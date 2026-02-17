"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  PopoverClose,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Building2, CalendarIcon, Clock3, Flag, MapPin, X } from "lucide-react";
import { Control, useFormContext } from "react-hook-form";
import { useState } from "react";
import { FormData } from "../schema";
import { cn } from "@/lib/utils";
import { toDateTimeLocalValue } from "@/lib/date-utils";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type Props = {
  control: Control<FormData>;
  watchedLocation?: string | null;
  watchedOrganiser?: string | null;
  watchedDateRange?: { from?: Date; to?: Date } | undefined;
};

type SchedulePublishPopoverProps = {
  control: Control<FormData>;
  watchedPublishAt?: string;
  onConfirmMessageChange?: (message: string | null) => void;
};

export function MetaPopovers({
  control,
  watchedLocation,
  watchedOrganiser,
  watchedDateRange,
}: Props) {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      {/* Location */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-2",
              watchedLocation && "bg-blue-50 text-blue-600"
            )}
          >
            <MapPin className="h-4 w-4" />
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
              "h-8 w-8 p-2",
              watchedOrganiser && "bg-blue-50 text-blue-600"
            )}
          >
            <Building2 className="h-4 w-4" />
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
              "h-8 w-8 p-2",
              watchedDateRange && "bg-blue-50 text-blue-600"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
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
                      <div className="border-t p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Selected Dates
                            {field.value.to && (
                              <span className="ml-1 text-xs">
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
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="secondary"
                            className="flex items-center bg-green-100 text-green-800"
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {format(field.value.from, "MMM dd, yyyy")}
                          </Badge>

                          {field.value.to && (
                            <Badge
                              variant="secondary"
                              className="flex items-center bg-red-100 text-red-800"
                            >
                              <Flag className="mr-1 h-3 w-3" />
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

function parsePublishDateTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function getCurrentTimeValue() {
  return format(new Date(), "HH:mm");
}

function getDefaultScheduleDateTimeValue() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(now.getHours(), now.getMinutes(), 0, 0);
  return toDateTimeLocalValue(tomorrow);
}

function getPublishAtLabel(value: string) {
  const parsed = parsePublishDateTime(value);
  if (!parsed) {
    return null;
  }

  return format(parsed, "MMM dd, yyyy 'at' hh:mm a");
}

export function SchedulePublishPopover({
  control,
  watchedPublishAt,
  onConfirmMessageChange,
}: SchedulePublishPopoverProps) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const { setValue } = useFormContext<FormData>();

  const handleOpenChange = (open: boolean) => {
    setIsScheduleOpen(open);

    if (!open) {
      return;
    }

    const parsedPublishAt = parsePublishDateTime(watchedPublishAt);
    if (parsedPublishAt) {
      return;
    }

    setValue("publishAt", getDefaultScheduleDateTimeValue(), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <div>
      <Popover open={isScheduleOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-2",
              watchedPublishAt && "bg-blue-50 text-blue-600"
            )}
          >
            <Clock3 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 pt-3" align="end">
          <FormField
            control={control}
            name="publishAt"
            render={({ field }) => {
              const selectedPublishDate = parsePublishDateTime(field.value);
              const effectiveSelectedDate = selectedPublishDate ?? new Date();

              return (
                <FormItem>
                  <FormControl>
                    <div className="space-y-3">
                      <label className="mb-1 block text-sm font-medium">
                        Schedule Publish
                      </label>

                      <Calendar
                        mode="single"
                        selected={effectiveSelectedDate}
                        onSelect={(selectedDate) => {
                          if (!selectedDate) {
                            field.onChange("");
                            return;
                          }

                          const existingDate = selectedPublishDate;
                          const nextDate = new Date(selectedDate);

                          if (existingDate) {
                            nextDate.setHours(
                              existingDate.getHours(),
                              existingDate.getMinutes(),
                              0,
                              0
                            );
                          } else {
                            const [hours, minutes] = getCurrentTimeValue()
                              .split(":")
                              .map((part) => Number.parseInt(part, 10));
                            nextDate.setHours(hours, minutes, 0, 0);
                          }

                          field.onChange(toDateTimeLocalValue(nextDate));
                        }}
                        captionLayout="dropdown-months"
                        numberOfMonths={1}
                        className="w-full rounded-md p-0"
                        classNames={{ root: "w-full" }}
                      />

                      <InputGroup>
                        <InputGroupInput
                          type="time"
                          step="60"
                          value={
                            selectedPublishDate
                              ? format(selectedPublishDate, "HH:mm")
                              : getCurrentTimeValue()
                          }
                          onChange={(event) => {
                            const [hours, minutes] = event.target.value
                              .split(":")
                              .map((part) => Number.parseInt(part, 10));

                            if (
                              Number.isNaN(hours) ||
                              Number.isNaN(minutes) ||
                              hours < 0 ||
                              hours > 23 ||
                              minutes < 0 ||
                              minutes > 59
                            ) {
                              return;
                            }

                            const baseDate = selectedPublishDate ?? new Date();
                            const nextDate = new Date(baseDate);
                            nextDate.setHours(hours, minutes, 0, 0);
                            field.onChange(toDateTimeLocalValue(nextDate));
                          }}
                        />
                      </InputGroup>

                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            field.onChange("");
                            onConfirmMessageChange?.(null);
                          }}
                          disabled={!field.value}
                        >
                          Clear schedule
                        </Button>

                        <PopoverClose asChild>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (
                                field.value &&
                                parsePublishDateTime(field.value)
                              ) {
                                onConfirmMessageChange?.(
                                  getPublishAtLabel(field.value)
                                );
                              } else {
                                onConfirmMessageChange?.(null);
                              }
                              setIsScheduleOpen(false);
                            }}
                          >
                            Confirm
                          </Button>
                        </PopoverClose>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
