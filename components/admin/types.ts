import { z } from "zod";
import { hasMeaningfulRichText } from "@/lib/rich-text";

export const toolkitTestimonialSchema = z.object({
  name: z.string(),
  role: z.string(),
  message: z.string().min(1, "Message is required"),
});

export const toolkitMentorshipLinkSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

export const toolkitMentorshipDetailsSchema = z.object({
  mentorshipPacked: z.string().optional(),
  formatOfMentorship: z.string().optional(),
  mentor: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    linkedinUrl: z.string().url({ message: "Valid LinkedIn URL is required" }).or(z.literal("")),
    instagramUrl: z.string().url().optional().or(z.literal("")),
    mailId: z.string().email().optional().or(z.literal("")),
    phoneNumber: z.string().optional(),
    otherLinks: z.array(toolkitMentorshipLinkSchema).optional(),
  }).optional(),
});

export const toolkitFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().refine((value) => hasMeaningfulRichText(value, 10), {
    message: "Description must be at least 10 characters.",
  }).refine((value) => value === undefined || value.split(/\s+/).length <= 150, {
    message: "Description must not exceed 150 words.",
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
  mentorshipDetails: toolkitMentorshipDetailsSchema.optional(),
  isActive: z.boolean().optional(),
  showSaleBadge: z.boolean().optional(),
  is_trending: z.boolean().optional(),
  isBundle: z.boolean().optional(),
  bundleItems: z.array(z.string()).optional(),
  isBestSeller: z.boolean().optional(),
  isLimitedSeats: z.boolean().optional(),
  digitalProductSectionId: z.string().uuid().optional().or(z.literal("")),
});

export type ToolkitFormValues = z.infer<typeof toolkitFormSchema>;

export interface DigitalProductSection {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  mentorshipDetails?: {
    mentorshipPacked?: string;
    formatOfMentorship?: string;
    mentor?: {
      name: string;
      description?: string;
      imageUrl?: string;
      linkedinUrl?: string;
      instagramUrl?: string;
      mailId?: string;
      phoneNumber?: string;
      otherLinks?: { title: string; url: string }[];
    };
  } | null;
  totalDuration: string | null;
  lessonCount: number | null;
  isActive: boolean;
  showSaleBadge: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  creatorName: string | null;
  is_trending?: boolean;
  is_featured_home?: boolean;
  trending_index?: number;
  featured_home_index?: number;
  isBundle: boolean;
  bundleItems: string[] | null;
  isBestSeller: boolean;
  isLimitedSeats: boolean;
  digitalProductSectionId: string | null;
  digitalProductSectionTitle?: string | null;
}
