import * as z from "zod";

export const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

export const ungatekeepFormSchema = z.object({
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  linkUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkTitle: z.string().optional(),
  linkImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  videoUrl: z
    .string()
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      "Invalid YouTube URL"
    )
    .optional()
    .or(z.literal("")),
  tag: z.string().optional(),
  filterTags: z.array(z.string()).default([]),
  toolkitId: z.string().uuid().optional().nullable(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  publishAt: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        (value.length > 0 && !Number.isNaN(new Date(value).getTime())),
      {
        message: "Please provide a valid publish date and time.",
      }
    ),
  attachments: z.array(z.string()).optional(),
});

export type UngatekeepFormValues = z.infer<typeof ungatekeepFormSchema>;
