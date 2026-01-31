"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pin, ExternalLink } from "lucide-react";
import { createUngatekeepStorage } from "@/lib/appwrite";
import { format } from "date-fns";
import CalendarWidget from "@/components/opportunity/CalendarWidget";
import FeaturedToolkits from "@/components/toolkit/FeaturedToolkits";

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

export default function UngatekeepPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const ungatekeepStorage = createUngatekeepStorage();

  const { data: post, isLoading, error } = useQuery<UngatekeepPost>({
    queryKey: ["ungatekeep", postId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/ungatekeep/${postId}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
        throw error;
      }
    },
    enabled: !!postId,
  });

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
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
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

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto max-w-7xl py-8 px-0">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <Skeleton className="h-8 w-24 mb-6" />
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-48 mb-8" />
              <Skeleton className="h-64 w-full rounded-lg mb-6" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="w-full lg:w-80 space-y-4">
              <Skeleton className="h-80 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto max-w-7xl py-8 px-0">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <Button
                variant="ghost"
                onClick={() => router.push("/ungatekeep")}
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Ungatekeep
              </Button>
              <div className="rounded-lg border bg-white py-12 text-center">
                <h3 className="mb-2 text-lg font-semibold text-gray-600">
                  Post not found
                </h3>
                <p className="text-gray-500">
                  This post may have been removed or doesn&apos;t exist.
                </p>
              </div>
            </div>
            <aside className="w-full lg:w-80 shrink-0">
              <div className="lg:sticky lg:top-20 space-y-4">
                <CalendarWidget />
                <FeaturedToolkits />
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto max-w-7xl py-8 px-0">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => router.push("/ungatekeep")}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ungatekeep
            </Button>

            {/* Main content card */}
            <article className="rounded-lg border bg-white p-4 md:p-6">
              {/* Header */}
              <header className="mb-4">
                <div className="flex items-start gap-2 mb-2">
                  {post.isPinned && (
                    <Pin className="h-5 w-5 text-primary shrink-0 mt-0.5" fill="currentColor" />
                  )}
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                    {post.title}
                  </h1>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  {/* Author */}
                  {post.creatorName && (
                    <div className="flex items-center gap-1.5">
                      {post.creatorImage ? (
                        <Image
                          src={post.creatorImage}
                          alt={post.creatorName}
                          width={20}
                          height={20}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                          {getInitials(post.creatorName)}
                        </div>
                      )}
                      <span className="font-medium text-foreground">{post.creatorName}</span>
                    </div>
                  )}
                  
                  <span>•</span>
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  
                  {post.tag && (
                    <>
                      <span>•</span>
                      <Badge variant={getTagBadgeVariant(post.tag)} className="text-xs">
                        {post.tag.replace("_", " ")}
                      </Badge>
                    </>
                  )}
                </div>
              </header>

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="mb-4">
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
                      {post.images.map((imageId, idx) => (
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

              {/* Content */}
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed text-gray-700">
                  {post.content}
                </p>
              </div>

              {/* Link Preview */}
              {post.linkUrl && (
                <div className="mt-4 border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors">
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
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        {post.linkTitle && (
                          <h4 className="font-semibold text-sm mb-0.5">
                            {post.linkTitle}
                          </h4>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {getHostname(post.linkUrl)}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                </div>
              )}
            </article>
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
              <CalendarWidget />
              <FeaturedToolkits />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
