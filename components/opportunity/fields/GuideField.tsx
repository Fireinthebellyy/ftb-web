"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ExternalLink, Video, Youtube } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isYouTubeUrl } from "@/lib/youtube";

export function GuideField() {
  const { control, watch, setValue } = useFormContext();

  const guideUrl = watch("guideUrl");
  const guideType = watch("guideType");

  // Auto-detect URL type when URL changes
  useEffect(() => {
    const trimmed = guideUrl?.trim() || "";
    if (trimmed.length > 0) {
      if (isYouTubeUrl(trimmed)) {
        if (guideType !== "youtube") {
          setValue("guideType", "youtube", { shouldValidate: true, shouldDirty: true });
        }
      } else {
        if (guideType !== "external") {
          setValue("guideType", "external", { shouldValidate: true, shouldDirty: true });
        }
      }
    } else {
      if (guideType) {
        setValue("guideType", "external", { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [guideUrl, guideType, setValue]);

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 transition-all hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
        <Video className="h-4 w-4 text-orange-600" />
        <span>Opportunity Guide / Video Resource</span>
      </div>

      <FormField
        control={control}
        name="guideUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Guide URL
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://notion.so/..."
                className="bg-white dark:bg-gray-950 text-sm"
              />
            </FormControl>
            <FormDescription className="text-[11px] text-gray-500">
              Attach a YouTube video walkthrough or an external guide link for applicants.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {guideUrl && guideUrl.trim().length > 0 && (
        <FormField
          control={control}
          name="guideType"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Resource Type
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value || (isYouTubeUrl(guideUrl) ? "youtube" : "external")}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem
                      value="youtube"
                      id="guide-type-youtube"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="guide-type-youtube"
                      className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 text-xs font-medium hover:bg-gray-50 peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:bg-red-50/50 dark:border-gray-800 dark:bg-gray-950 dark:peer-data-[state=checked]:border-red-500 dark:peer-data-[state=checked]:bg-red-950/20"
                    >
                      <div className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-600" />
                        <span>YouTube Video</span>
                      </div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="external"
                      id="guide-type-external"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="guide-type-external"
                      className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 text-xs font-medium hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50/50 dark:border-gray-800 dark:bg-gray-950 dark:peer-data-[state=checked]:border-blue-500 dark:peer-data-[state=checked]:bg-blue-950/20"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <span>External Link</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
