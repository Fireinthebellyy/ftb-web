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
    <Link
      href={`/ungatekeep/${post.id}`}
      className="block group"
    >
      <article className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
        {/* Left: Square Image */}
        <div className="relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No img
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top: Title + Badge */}
          <div>
            <div className="flex items-start gap-1.5 mb-0.5">
              {post.isPinned && (
                <Pin className="h-3 w-3 text-primary shrink-0 mt-0.5" fill="currentColor" />
              )}
              <h3 className="text-sm md:text-base font-semibold leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-snug">
              {post.content}
            </p>
          </div>

          {/* Bottom: User + Time + Badge */}
          <div className="flex items-center gap-1.5 mt-1">
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
                  <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[8px] text-muted-foreground font-medium">
                    {getInitials(post.creatorName)}
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                  {post.creatorName}
                </span>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground">•</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            {post.tag && (
              <Badge
                variant={getTagBadgeVariant(post.tag)}
                className="shrink-0 text-[10px] px-1 py-0 h-4 ml-auto"
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
