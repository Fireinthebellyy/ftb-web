"use client";

import { Control, useFieldArray, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolkitImageInput } from "./ToolkitImageInput";
import { DigitalProductSection, ToolkitFormValues } from "./types";

const CATEGORIES = [
  "1:1 Mentorship",
  "Recorded toolkits",
  "digital products",
  "Cohort",
];

interface MentorOption {
  id: string;
  mentorName: string;
  mentorEmail?: string;
}

interface ToolkitFormFieldsProps {
  control: Control<ToolkitFormValues>;
  coverImageFile: File | null;
  bannerImageFile: File | null;
  onCoverImageFileSelect: (file: File | null) => void;
  onBannerImageFileSelect: (file: File | null) => void;
  onCoverImageRemove: () => void;
  onBannerImageRemove: () => void;
  digitalProductSections?: DigitalProductSection[];
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
  digitalProductSections: _digitalProductSections = [],
  isSubmitting = false,
}: ToolkitFormFieldsProps) {
  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({
    control,
    name: "testimonials",
  });
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "cohortDetails.customQuestions"
  });
  
  const selectedCategory = useWatch({ control, name: "category" });
  const isCohort = selectedCategory === "Cohort";
  const isDigitalProduct = selectedCategory === "digital products";

  const { data: mentors = [] } = useQuery({
    queryKey: ["admin", "mentors"],
    queryFn: async () => (await axios.get<MentorOption[]>("/api/admin/mentors")).data,
    enabled: selectedCategory === "1:1 Mentorship" || isCohort,
    staleTime: 1000 * 60,
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
              <Input placeholder="Enter toolkit title" {...field} value={field.value ?? ""} />
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
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Enter detailed description"
                className="[&_div.ql-container]:min-h-[160px] [&_div.ql-editor]:max-h-[28vh] [&_div.ql-editor]:min-h-[160px] [&_div.ql-editor]:overflow-y-auto"
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
                  value={field.value ?? ""}
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
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Input placeholder="e.g., 2h 30m" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {selectedCategory === "1:1 Mentorship" && (
        <div className="space-y-4 rounded-lg border p-4 bg-orange-50/50">
          <h3 className="font-semibold text-lg text-orange-900">1:1 Mentorship Details</h3>
          
          <FormField
            control={control}
            name="mentorshipDetails.mentorshipPacked"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What is the mentorship packed with?</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="List the key deliverables..."
                    className="[&_div.ql-container]:min-h-[120px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="mentorshipDetails.formatOfMentorship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Format of Mentorship</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Describe how the sessions will be conducted..."
                    className="[&_div.ql-container]:min-h-[120px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 rounded-lg border bg-white p-4">
            <h4 className="font-medium text-gray-900">About the Mentor</h4>
            <FormField
              control={control}
              name="mentorshipDetails.mentorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Mentor *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a mentor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mentors.map((mentor) => (
                        <SelectItem key={mentor.id} value={mentor.id}>
                          {mentor.mentorName} ({mentor.mentorEmail})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {/* Digital product section dropdown has been removed based on user request */}

      {!isDigitalProduct ? (
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
      ) : null}

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
              <Input placeholder="https://youtube.com/embed/..." {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="rating"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rating (e.g. 4.8)</FormLabel>
            <FormControl>
              <Input placeholder="4.8" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subtitle (e.g. 1 lesson • 15 mins)</FormLabel>
            <FormControl>
              <Input placeholder="1 lesson • 15 mins" {...field} value={field.value ?? ""} />
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
                  field.onChange(e.target.value.split(",").map(v => v.trim()).filter(Boolean));
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
            onClick={() => appendTestimonial({ name: "", role: "", message: "" })}
            disabled={isSubmitting}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add testimonial
          </Button>
        </div>

        {testimonialFields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={control}
                name={`testimonials.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Aditi Sharma" {...field} value={field.value ?? ""} />
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
                      <Input placeholder="Final Year Student" {...field} value={field.value ?? ""} />
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
                onClick={() => removeTestimonial(index)}
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
      
      {isCohort && (
        <div className="space-y-6 rounded-lg border p-4 bg-blue-50/50">
          <h3 className="font-semibold text-lg text-blue-900">Cohort Settings</h3>
          
          <div className="space-y-3">
            <FormLabel>Select Cohort Mentors</FormLabel>
            <FormField
              control={control}
              name="cohortDetails.mentorIds"
              render={({ field }) => (
                <div className="grid sm:grid-cols-2 gap-2">
                  {mentors.map((mentor) => (
                    <div key={mentor.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`mentor-${mentor.id}`}
                        checked={field.value?.includes(mentor.id) || false}
                        onChange={(e) => {
                          const current = field.value || [];
                          if (e.target.checked) {
                            field.onChange([...current, mentor.id]);
                          } else {
                            field.onChange(current.filter(id => id !== mentor.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`mentor-${mentor.id}`} className="text-sm">
                        {mentor.mentorName}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <FormLabel>Custom Onboarding Questions</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendQuestion({ id: crypto.randomUUID(), question: "", type: "text" })}
                disabled={isSubmitting}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add question
              </Button>
            </div>

            {questionFields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-lg border border-blue-100 bg-white p-3">
                <div className="flex justify-between items-start">
                  <FormField
                    control={control}
                    name={`cohortDetails.customQuestions.${index}.question`}
                    render={({ field }) => (
                      <FormItem className="flex-1 mr-4">
                        <FormLabel>Question text</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., What are your goals?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeQuestion(index)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
