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
import { ArrowLeft, Pin, ExternalLink, FileText, Flame } from "lucide-react";
import { format } from "date-fns";
import FeaturedToolkits from "@/components/toolkit/FeaturedToolkits";
import HtmlRenderer from "@/components/toolkit/HtmlRenderer";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";

type UngatekeepPost = {
  id: string;
  content: string;
  attachments: string[];
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkImage?: string | null;
  videoUrl?: string | null;
  tag?: "announcement" | "company_experience" | "resources" | "playbooks" | "college_hacks" | "interview" | "ama_drops" | "ftb_recommends" | null;
  isPinned: boolean;
  isSaved?: boolean;
  publishedAt?: string | null;
  createdAt: string;
  creatorName?: string | null;
  creatorImage?: string | null;
  recommendedToolkit?: {
    id: string;
    title: string;
    price: number | null;
    originalPrice: number | null;
    coverImageUrl: string | null;
  } | null;
};

export default function UngatekeepPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setIsMobile(
      typeof window !== "undefined" &&
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }, []);

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<UngatekeepPost>({
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
    return tryGetStoragePublicUrl("ungatekeep-images", imageId);
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

  const getYouTubeEmbedUrl = (url: string | null | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 pt-2 pb-4 md:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            <div className="flex-1">
              <Skeleton className="mb-6 h-8 w-24" />
              <Skeleton className="mb-4 h-10 w-3/4" />
              <Skeleton className="mb-8 h-6 w-48" />
              <Skeleton className="mb-6 h-64 w-full rounded-lg" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="w-full space-y-4 lg:w-80">
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
        <div className="container mx-auto max-w-7xl px-4 pt-2 pb-4 md:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            <div className="flex-1">
              <Button
                variant="ghost"
                onClick={() => router.push("/ungatekeep")}
                className="mb-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
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
            <aside className="w-full shrink-0 lg:w-80">
              <div className="space-y-4 lg:sticky lg:top-20">
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
      <div className="container mx-auto max-w-7xl px-4 pt-2 pb-4 md:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => router.push("/ungatekeep")}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ungatekeep
            </Button>

            {/* Main content card */}
            <article className="rounded-lg border bg-white p-4 md:p-6">
              {/* Header */}
              <header className="mb-4">
                <div className="mb-2 flex items-start gap-2">
                  {post.isPinned && (
                    <Pin
                      className="text-primary mt-0.5 h-5 w-5 shrink-0"
                      fill="currentColor"
                    />
                  )}
                </div>

                {/* Meta info */}
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs md:text-sm">
                  {/* Author */}
                  {post.creatorName && (
                    <div className="flex items-center gap-1.5">
                      {post.creatorImage ? (
                        <Image
                          src={tryGetStoragePublicUrl(
                            "avatar-images",
                            post.creatorImage
                          )}
                          alt={post.creatorName}
                          width={20}
                          height={20}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium">
                          {getInitials(post.creatorName)}
                        </div>
                      )}
                      <span className="text-foreground font-medium">
                        {post.creatorName}
                      </span>
                    </div>
                  )}

                  <span>•</span>
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>

                  {post.tag && (
                    <>
                      <span>•</span>
                      <Badge
                        variant={getTagBadgeVariant(post.tag)}
                        className="text-xs"
                      >
                        {post.tag.replace("_", " ")}
                      </Badge>
                    </>
                  )}
                </div>
              </header>

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="mb-4">
                  {post.attachments.length === 1 ? (
                    (() => {
                      const imageId = post.attachments[0];
                      const isPdf = imageId.toLowerCase().endsWith(".pdf");
                      const fullUrl = getImageUrl(imageId);
                      const pdfSrc = isMobile
                        ? `https://docs.google.com/viewer?url=${encodeURIComponent(
                            fullUrl
                          )}&embedded=true`
                        : `${fullUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;

                      if (isPdf) {
                        if (isMobile === null) {
                          return (
                            <div className="relative aspect-[9/16] max-h-[400px] w-full overflow-hidden rounded-lg border bg-muted animate-pulse md:aspect-video md:max-h-none" />
                          );
                        }
                        return (
                          <div className="relative aspect-[9/16] max-h-[400px] w-full overflow-hidden rounded-lg border bg-white md:aspect-video md:max-h-none">
                            <iframe
                              src={pdfSrc}
                              className="h-full w-full border-none"
                              title="PDF Document"
                            />
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white/90 text-primary absolute bottom-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-md transition-colors hover:bg-white"
                              title="Open full document"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        );
                      }

                      return (
                        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg">
                          <Image
                            src={fullUrl}
                            alt="Post attachment"
                            fill
                            className="object-cover"
                          />
                        </div>
                      );
                    })()
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {post.attachments.map((fileId, idx) => {
                        const isPdf = fileId.toLowerCase().endsWith(".pdf");
                        const fullUrl = getImageUrl(fileId);

                        if (isPdf) {
                          return (
                            <div
                              key={idx}
                              className="bg-muted relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border"
                            >
                              <FileText className="h-10 w-10 text-blue-500" />
                              <span className="px-2 text-center text-[10px] font-medium line-clamp-1">
                                PDF Document
                              </span>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-medium"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open
                              </a>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="bg-muted relative aspect-square overflow-hidden rounded-lg"
                          >
                            <Image
                              src={fullUrl}
                              alt={`Post attachment ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {(() => {
                const embedUrl = getYouTubeEmbedUrl(post.videoUrl);
                return (
                  embedUrl && (
                    <div className="mb-4 overflow-hidden rounded-lg border bg-black">
                      <div className="relative aspect-video w-full">
                        <iframe
                          src={embedUrl}
                          title="YouTube video player"
                          className="absolute inset-0 h-full w-full border-none"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Content */}
              <HtmlRenderer content={post.content} />

              {/* Link Preview */}
              {post.linkUrl && (
                <div className="hover:bg-muted/50 mt-4 overflow-hidden rounded-lg border transition-colors">
                  <Link
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {post.linkImage && (
                      <div className="bg-muted relative aspect-video w-full overflow-hidden">
                        <Image
                          src={post.linkImage}
                          alt={post.linkTitle || "Link preview"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3">
                      <div>
                        {post.linkTitle && (
                          <h4 className="mb-0.5 text-sm font-semibold">
                            {post.linkTitle}
                          </h4>
                        )}
                        <p className="text-muted-foreground text-xs">
                          {getHostname(post.linkUrl)}
                        </p>
                      </div>
                      <ExternalLink className="text-muted-foreground h-4 w-4 shrink-0" />
                    </div>
                  </Link>
                </div>
              )}

              {post.recommendedToolkit?.id && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <div className="bg-orange-100 p-1 rounded-full">
                      <Flame className="h-4 w-4 text-orange-600" />
                    </div>
                    Recommended Toolkit
                  </h3>
                  <div className="bg-orange-50/50 border-orange-200 group relative flex flex-col gap-4 rounded-xl border p-4 transition-all hover:bg-orange-50">
                    <Link
                      href={`/toolkit/${post.recommendedToolkit.id}`}
                      className="flex gap-4"
                    >
                      {post.recommendedToolkit.coverImageUrl && (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border shadow-sm sm:h-24 sm:w-24">
                          <Image
                            src={post.recommendedToolkit.coverImageUrl}
                            alt={post.recommendedToolkit.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-center gap-2">
                        <h4 className="text-foreground line-clamp-2 text-base font-bold leading-tight transition-colors group-hover:text-orange-600">
                          {post.recommendedToolkit.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          {post.recommendedToolkit.price !== null && (
                            <span className="text-lg font-black text-orange-600">
                              ₹{post.recommendedToolkit.price}
                            </span>
                          )}
                          {post.recommendedToolkit.originalPrice && (
                            <span className="text-muted-foreground text-xs line-through decoration-muted-foreground/50">
                              ₹{post.recommendedToolkit.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-orange-600 text-white self-center rounded-full p-2 shadow-md transition-transform group-hover:scale-110 group-active:scale-95">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </article>
          </div>

          {/* Right Sidebar */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="space-y-4 lg:sticky lg:top-20">
              <FeaturedToolkits />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
