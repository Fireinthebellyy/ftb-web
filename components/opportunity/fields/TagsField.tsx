"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Hash, X } from "lucide-react";
import { Control, useFormContext } from "react-hook-form";
import { FormData } from "../schema";
import { TagsDropdown } from "../TagsDropdown";

type Props = {
  control: Control<FormData>;
};

export function TagsField({ control }: Props) {
  const { clearErrors } = useFormContext<FormData>();

  return (
    <FormField
      control={control}
      name="tags"
      render={({ field }) => {
        const selectedTags = field.value
          ? field.value
              .split("|")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        const handleTagsChange = (newTags: string[]) => {
          const nextValue = newTags.length > 0 ? newTags.join("|") + "|" : "";
          field.onChange(nextValue);
          clearErrors("tags");
        };

        return (
          <FormItem>
            <FormControl>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <TagsDropdown
                    selectedTags={selectedTags}
                    onTagsChange={handleTagsChange}
                    className="w-full justify-between"
                    align="start"
                  />
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {selectedTags.map((tag) => {
                      const match = tag.match(/^(.*)\((.*)\)$/);
                      const label = match ? match[1] : tag;
                      const description = match ? match[2] : "";
                      return (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                          title={description}
                        >
                          {label}
                          <button
                            type="button"
                            className="rounded-full p-0.5 text-blue-700 hover:bg-blue-300/60"
                            onClick={() => {
                              handleTagsChange(selectedTags.filter((t) => t !== tag));
                            }}
                            aria-label={`Remove ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
