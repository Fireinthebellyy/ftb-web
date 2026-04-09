import { z } from "zod";
import { stripHtml } from "@/lib/utils";

export const formSchema = z.object({
  type: z.string().min(1, {
    message: "Please select an opportunity type.",
  }),
  title: z
    .string()
    .min(4, {
      message: "Title must be at least 4 characters.",
    })
    .max(100, {
      message: "Title must not exceed 100 characters.",
    }),
  description: z
    .string()
    .refine((val) => stripHtml(val).length >= 10, {
      message: "Description must be at least 10 characters.",
    })
    .refine((val) => stripHtml(val).length <= 4000, {
      message: "Description must not exceed 4000 characters.",
    }),
  tags: z.string().min(2, {
    message: "Please add at least one tag.",
  }),
  location: z.string().optional(),
  organiserInfo: z.string().optional(),
  applyLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
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
});

export type FormData = z.infer<typeof formSchema>;
