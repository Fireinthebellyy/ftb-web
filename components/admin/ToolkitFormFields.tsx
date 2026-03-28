"use client";

import { Control, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ToolkitImageInput } from "./ToolkitImageInput";
import { ToolkitFormValues } from "./types";

interface ToolkitFormFieldsProps {
  control: Control<ToolkitFormValues>;
  coverImageFile: File | null;
  bannerImageFile: File | null;
  onCoverImageFileSelect: (file: File | null) => void;
  onBannerImageFileSelect: (file: File | null) => void;
  onCoverImageRemove: () => void;
  onBannerImageRemove: () => void;
  isSubmitting?: boolean;
}

export function ToolkitFormFields({
  control,
  coverImageFile,
  bannerImageFile,
  onCoverImageFileSelect,
  onBannerImageFileSelect,
  onCoverImageRemove,
  onBannerImageRemove,
  isSubmitting = false,
}: ToolkitFormFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "testimonials",
  });

  return (
    <>
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title *</FormLabel>
            <FormControl>
              <Input placeholder="Enter toolkit title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter detailed description"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (₹) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="299"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="originalPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original Price (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="999"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="Enter category" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="totalDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Duration</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2h 30m" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="coverImageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cover Image *</FormLabel>
            <FormControl>
              <ToolkitImageInput
                label="Cover image"
                imageUrl={field.value ?? ""}
                selectedFile={coverImageFile}
                onFileSelect={onCoverImageFileSelect}
                onRemove={onCoverImageRemove}
                disabled={isSubmitting}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="bannerImageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Banner Image (HD, optional)</FormLabel>
            <FormControl>
              <ToolkitImageInput
                label="Banner image"
                imageUrl={field.value ?? ""}
                selectedFile={bannerImageFile}
                onFileSelect={onBannerImageFileSelect}
                onRemove={onBannerImageRemove}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="videoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>YouTube Promo Video URL</FormLabel>
            <FormControl>
              <Input placeholder="https://youtube.com/embed/..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="highlights"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Highlights (comma-separated)</FormLabel>
            <FormControl>
              <Input
                placeholder="Lifetime access, Downloadable resources, Certificate"
                value={field.value?.join(", ") ?? ""}
                onChange={(e) => {
                  field.onChange(e.target.value.split(","));
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FormLabel>Testimonials</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", role: "", message: "" })}
            disabled={isSubmitting}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add testimonial
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={control}
                name={`testimonials.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Aditi Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`testimonials.${index}.role`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Final Year Student" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name={`testimonials.${index}.message`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share the learner outcome"
                      className="min-h-[90px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">Active</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="showSaleBadge"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">
                  Show Sale Badge
                </FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
