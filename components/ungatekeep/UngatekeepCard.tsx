"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Pin } from "lucide-react";
import { createUngatekeepStorage } from "@/lib/appwrite";
import { formatDistanceToNow } from "date-fns";

type UngatekeepPost = {
  id: string;
  title: string;
  content: string;
  images: string[];
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkImage?: string | null;
  tag?: "announcement" | "company_experience" | "resources" | null;
  isPinned: boolean;
  publishedAt?: string | null;
  createdAt: string;
  creatorName?: string | null;
  creatorImage?: string | null;
};

interface UngatekeepCardProps {
  post: UngatekeepPost;
}

export default function UngatekeepCard({ post }: UngatekeepCardProps) {
  const ungatekeepStorage = createUngatekeepStorage();

  const getTagBadgeVariant = (tag: string | null | undefined) => {
    switch (tag) {
      case "announcement":
        return "default";
      case "company_experience":
        return "secondary";
      case "resources":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const getImageUrl = (imageId: string) => {
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID;
    if (!bucketId) return "";
    try {
      return ungatekeepStorage.getFileView(bucketId, imageId);
    } catch (error) {
      console.error("Error getting image URL:", error);
      return "";
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const hasImage = post.images && post.images.length > 0;
  const primaryImage = hasImage ? getImageUrl(post.images[0]) : null;

  return (
    <Link href={`/ungatekeep/${post.id}`} className="group block">
      <article className="bg-card hover:bg-muted/50 flex gap-3 rounded-lg border p-3 transition-colors">
        {/* Left: Square Image */}
        <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-md md:h-24 md:w-24">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
              No img
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {/* Top: Title + Badge */}
          <div>
            <div className="mb-0.5 flex items-start gap-1.5">
              {post.isPinned && (
                <Pin
                  className="text-primary mt-0.5 h-3 w-3 shrink-0"
                  fill="currentColor"
                />
              )}
              <h3 className="text-foreground group-hover:text-primary line-clamp-1 text-sm leading-tight font-semibold transition-colors md:text-base">
                {post.title}
              </h3>
            </div>

            {/* Description - Strip HTML for preview */}
            <p
              className="text-muted-foreground line-clamp-2 text-xs leading-snug md:text-sm"
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/<[^>]*>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim(),
              }}
            />
          </div>

          {/* Bottom: User + Time + Badge */}
          <div className="mt-1 flex items-center gap-1.5">
            {/* Small profile photo */}
            {post.creatorName && (
              <div className="flex items-center gap-1">
                {post.creatorImage ? (
                  <Image
                    src={post.creatorImage}
                    alt={post.creatorName}
                    width={14}
                    height={14}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-muted-foreground/20 text-muted-foreground flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-medium">
                    {getInitials(post.creatorName)}
                  </div>
                )}
                <span className="text-muted-foreground max-w-[80px] truncate text-[10px]">
                  {post.creatorName}
                </span>
              </div>
            )}
            <span className="text-muted-foreground text-[10px]">•</span>
            <span className="text-muted-foreground shrink-0 text-[10px]">
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            {post.tag && (
              <Badge
                variant={getTagBadgeVariant(post.tag)}
                className="ml-auto h-4 shrink-0 px-1 py-0 text-[10px]"
              >
                {post.tag.replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
