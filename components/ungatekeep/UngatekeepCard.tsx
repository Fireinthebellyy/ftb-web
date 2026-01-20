"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {post.isPinned && (
                <Pin className="h-4 w-4 text-primary" fill="currentColor" />
              )}
              <h3 className="text-lg font-semibold leading-tight">
                {post.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {post.creatorName && (
                <>
                  <span className="font-medium">{post.creatorName}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </div>
          </div>
          {post.tag && (
            <Badge variant={getTagBadgeVariant(post.tag)} className="shrink-0">
              {post.tag.replace("_", " ")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main content */}
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="grid gap-2">
            {post.images.length === 1 ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={getImageUrl(post.images[0])}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.images.slice(0, 4).map((imageId, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={getImageUrl(imageId)}
                      alt={`${post.title} - Image ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Link Preview */}
        {post.linkUrl && (
          <div className="border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors">
            <Link
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {post.linkImage && (
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <Image
                    src={post.linkImage}
                    alt={post.linkTitle || "Link preview"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                {post.linkTitle && (
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                    {post.linkTitle}
                  </h4>
                )}
                <p className="text-xs text-muted-foreground truncate">
                  {new URL(post.linkUrl).hostname}
                </p>
              </div>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
