import { z } from "zod";

export const internshipFormSchema = z.object({
  type: z.enum(["part-time", "full-time", "contract", "remote"], {
    message: "Please select an internship type.",
  }).optional(),
  title: z
    .string()
    .min(1, {
      message: "Title is required.",
    })
    .max(100, {
      message: "Title must not exceed 100 characters.",
    }),
  description: z
    .string()
    .min(1, {
      message: "Description is required.",
    })
    .max(2000, {
      message: "Description must not exceed 2000 characters.",
    }),
  hiringOrganization: z.string().min(1, {
    message: "Hiring organization is required.",
  }),
  tags: z.string().optional(),
  location: z.string().optional(),
  stipend: z.number().min(0).optional(),
  hiringManager: z.string().optional(),
  link: z.string().url().optional().or(z.literal("")),
  deadline: z.string().optional(),
  poster: z.string().optional(),
});

export type InternshipFormData = z.infer<typeof internshipFormSchema>;
