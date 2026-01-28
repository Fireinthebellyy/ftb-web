import { z } from "zod";

export const internshipFormSchema = z.object({
  type: z.enum(["in-office", "work-from-home", "hybrid"], {
    message: "Please select an internship type.",
  }),
  timing: z.enum(["full-time", "part-time", "shift-based"], {
    message: "Please select an internship timing.",
  }),
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
  eligibility: z.array(z.string()).optional(),
  location: z.string().optional(),
  experience: z.string().optional(),
  duration: z.string().optional(),
  stipend: z
    .coerce
    .number({
      message: "Stipend must be a number.",
    })
    .nonnegative({
      message: "Stipend must be a positive number.",
    })
    .optional(),
  hiringManager: z
    .string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z\s]+$/.test(val), {
      message: "Hiring Manager must contain only letters and spaces.",
    }),
  hiringManagerEmail: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address.",
    }),
  link: z.string().url().optional().or(z.literal("")),
  deadline: z.string().optional(),
  poster: z.string().min(1, {
    message: "Company logo is required.",
  }),
});

export type InternshipFormData = z.infer<typeof internshipFormSchema>;
