import { z } from "zod";

export const toolkitFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number." }),
  originalPrice: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  totalDuration: z.string().optional(),
  lessonCount: z.coerce.number().int().min(0).optional(),
  highlights: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type ToolkitFormValues = z.infer<typeof toolkitFormSchema>;

export interface Toolkit {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  coverImageUrl: string | null;
  videoUrl: string | null;
  contentUrl: string | null;
  category: string | null;
  highlights: string[] | null;
  totalDuration: string | null;
  lessonCount: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  creatorName: string | null;
}
