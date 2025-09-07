import { z } from "zod";

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
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(2000, {
      message: "Description must not exceed 2000 characters.",
    }),
  tags: z.string().min(2, {
    message: "Please add at least one tag.",
  }),
  location: z.string().optional(),
  organiserInfo: z.string().optional(),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
});

export type FormData = z.infer<typeof formSchema>;
