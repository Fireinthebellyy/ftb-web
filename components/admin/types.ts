import { z } from "zod";
import { hasMeaningfulRichText } from "@/lib/rich-text";

export const toolkitTestimonialSchema = z.object({
  name: z.string(),
  role: z.string(),
  message: z.string().min(1, "Message is required"),
});

export const toolkitFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().refine((value) => hasMeaningfulRichText(value, 10), {
    message: "Description must be at least 10 characters.",
  }),
  price: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number." }),
  originalPrice: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  bannerImageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  totalDuration: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  testimonials: z.array(toolkitTestimonialSchema).optional(),
  isActive: z.boolean().optional(),
  showSaleBadge: z.boolean().optional(),
});

export type ToolkitFormValues = z.infer<typeof toolkitFormSchema>;

export interface Toolkit {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
  videoUrl: string | null;
  contentUrl: string | null;
  category: string | null;
  highlights: string[] | null;
  testimonials:
    | {
        name: string;
        role: string;
        message: string;
      }[]
    | null;
  totalDuration: string | null;
  lessonCount: number | null;
  isActive: boolean;
  showSaleBadge: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  creatorName: string | null;
  is_trending: boolean;    
  is_featured_home: boolean; 
  trending_index?: number;
  featured_home_index?: number;
}
