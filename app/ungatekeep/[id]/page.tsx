"use client";

/* eslint-disable max-lines */

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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Pin, ExternalLink, Flame } from "lucide-react";
import { format } from "date-fns";
import FeaturedToolkits from "@/components/toolkit/FeaturedToolkits";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";
import { useSession } from "@/hooks/use-session";
import { AttachmentSlide, ImageModal } from "@/components/ungatekeep/UngatekeepMediaComponents";
import { UngatekeepPostActionBar } from "@/components/ungatekeep/UngatekeepPostActionBar";
import UngatekeepCommentSection from "@/components/ungatekeep/UngatekeepCommentSection";
import { stripHtml, cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";

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
  score?: number;
  userVote?: number;
  commentCount?: number;
  publishedAt?: string | null;
  createdAt: string;
  creatorName?: string | null;
  creatorImage?: string | null;
  is_trending?: boolean;
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
  const { data: session, isPending: sessionPending } = useSession();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalIndex, setModalIndex] = React.useState(0);
  const [isSaved, setIsSaved] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [isFlying, setIsFlying] = React.useState(false);
  const [flyPos, setFlyPos] = React.useState({ x: 0, y: 0 });
  const [isContentExpanded, setIsContentExpanded] = React.useState(false);
  const [safeHtml, setSafeHtml] = React.useState(() =>
    typeof window !== "undefined" ? "" : ""
  );

  const postId = params.id as string;

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!sessionPending && !session) {
      router.replace(`/login?returnUrl=%2Fungatekeep%2F${postId}`);
    }
  }, [session, sessionPending, router, postId]);



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
    enabled: !!postId && !!session?.user,
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

  const WHATSAPP_NUMBER = "916377492042";

  const plainTextContent = post ? stripHtml(post.content) : "";

  const askQueryHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Type: Ungatekeep post query\nSource: ${typeof window !== "undefined" ? window.location.origin : ""}/ungatekeep/${postId}\n\nPost: ${plainTextContent.slice(0, 100)}...\n\nMy question:`
  )}`;

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const buttonElement = e.currentTarget as HTMLElement;

    posthog.capture("ungatekeep_save_button_clicked", {
      post_id: postId,
      action: isSaved ? "unsave" : "save",
    });

    // Optimistic UI update
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);

    try {
      const response = await axios.post("/api/ungatekeep/bookmark", {
        postId: postId,
        bookmarked: !isSaved,
      });

      // Nested try-catch to isolate potential errors after successful API call
      try {
        if (response.data && typeof response.data.bookmarked === "boolean") {
          const newSavedStatus = response.data.bookmarked;
          // The optimistic update is reverted/confirmed, so we set the state from the server response.
          setIsSaved(newSavedStatus);

          if (newSavedStatus) {
            const rect = buttonElement.getBoundingClientRect();
            setFlyPos({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            });
            setIsFlying(true);
            toast.success("Post saved successfully");
            setTimeout(() => setIsFlying(false), 800);
          } else {
            toast.success("Post removed from saved");
          }

          // Invalidate queries to refetch data, which replaces the old localStorage logic.
          queryClient.invalidateQueries({ queryKey: ["ungatekeep"] });
          queryClient.invalidateQueries({
            queryKey: ["ungatekeep-saved-count"],
          });
          queryClient.invalidateQueries({ queryKey: ["ungatekeep-saved"] });
        } else {
          // If response is not what we expect, throw an error
          throw new Error("Invalid response structure from server");
        }
      } catch (innerError) {
        console.error("Error processing bookmark response:", innerError);
        // Throw the inner error to be caught by the outer catch block
        throw innerError;
      }
    } catch (error) {
      // Revert on error
      setIsSaved(previousSaved);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Please login to save posts");
      } else {
        // Log the actual error for debugging
        console.error("Failed to update saved status:", error);
        toast.error("Failed to update saved status");
      }
    }
  };

  React.useEffect(() => {
    if (post) {
      setIsSaved(post.isSaved || false);
      if (typeof window !== "undefined") {
        setSafeHtml(DOMPurify.sanitize(post.content));
      }
    }
  }, [post?.isSaved, post?.content, post]);

  const mediaItems: (
    | { type: "attachment"; id: string }
    | { type: "video"; url: string }
  )[] = post
    ? [
        ...(post.attachments || []).map((id) => ({
          type: "attachment" as const,
          id,
        })),
        ...(getYouTubeEmbedUrl(post.videoUrl)
          ? [
              {
                type: "video" as const,
                url: getYouTubeEmbedUrl(post.videoUrl)!,
              },
            ]
          : []),
      ]
    : [];

  if (sessionPending || !session || isLoading) {
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

              {/* Attachments/Media */}
              {mediaItems.length > 0 ? (
                <div className="mb-4 relative">
                  {mediaItems.length === 1 ? (
                    (() => {
                      const item = mediaItems[0];
                      if (item.type === "attachment") {
                        return (
                          <div className="relative aspect-square max-h-[400px] w-full overflow-hidden rounded-lg bg-muted border">
                            <AttachmentSlide
                              imageId={item.id}
                              postTitle={"Post"}
                              onClick={() => {
                                if (
                                  !item.id.toLowerCase().endsWith(".pdf")
                                ) {
                                  setModalIndex(0);
                                  setModalOpen(true);
                                }
                              }}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black border">
                            <iframe
                              src={item.url}
                              title="YouTube video player"
                              className="absolute inset-0 h-full w-full border-none"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="px-1">
                      <Carousel
                        className="w-full"
                        opts={{ align: "start", loop: false }}
                      >
                        <CarouselContent className="-ml-2">
                          {mediaItems.map((item, idx) => (
                            <CarouselItem
                              key={idx}
                              className="basis-[85%] pl-2 sm:basis-[75%]"
                            >
                              <div className="relative aspect-square max-h-[400px] w-full overflow-hidden rounded-lg bg-muted border">
                                {item.type === "attachment" ? (
                                  <AttachmentSlide
                                    imageId={item.id}
                                    postTitle={"Post"}
                                    idx={idx}
                                    onClick={() => {
                                      if (
                                        !item.id
                                          .toLowerCase()
                                          .endsWith(".pdf")
                                      ) {
                                        // Find the index in the filtered images list
                                        const imagesOnly = mediaItems.filter(
                                          (mi) =>
                                            mi.type === "attachment" &&
                                            !mi.id
                                              .toLowerCase()
                                              .endsWith(".pdf")
                                        );
                                        const imgIdx =
                                          imagesOnly.findIndex(
                                            (mi) =>
                                              mi.type === "attachment" &&
                                              mi.id === item.id
                                          );
                                        setModalIndex(
                                          imgIdx >= 0 ? imgIdx : 0
                                        );
                                        setModalOpen(true);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full bg-black">
                                    <iframe
                                      src={item.url}
                                      title="YouTube video player"
                                      className="absolute inset-0 h-full w-full border-none"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {mediaItems.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2 h-7 w-7 sm:h-8 sm:w-8 bg-orange-500 text-white hover:bg-orange-600 hover:text-white border-none shadow-md z-20 [&_svg]:size-4" />
                            <CarouselNext className="right-2 h-7 w-7 sm:h-8 sm:w-8 bg-orange-500 text-white hover:bg-orange-600 hover:text-white border-none shadow-md z-20 [&_svg]:size-4" />
                          </>
                        )}
                      </Carousel>
                    </div>
                  )}
                  <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="mx-auto min-w-auto p-0 md:min-w-3xl border-none bg-transparent shadow-none">
                      <ImageModal
                        attachments={post?.attachments || []}
                        postTitle={"Post"}
                        modalIndex={modalIndex}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              ) : null}



              {/* Content */}
              <div className="w-full overflow-hidden px-3 pt-5 pb-3 text-left leading-[0.9] sm:pt-6">
                {(() => {
                  const CONTENT_PREVIEW_LENGTH = 150;
                  const hasLongContent =
                    plainTextContent.length > CONTENT_PREVIEW_LENGTH;

                  const previewContent =
                    hasLongContent && !isContentExpanded
                      ? `${plainTextContent
                          .slice(0, CONTENT_PREVIEW_LENGTH)
                          .trim()}...`
                      : post.content;

                  return (
                    <>
                      {isContentExpanded || !hasLongContent ? (
                        <div
                          className={cn(
                            "text-gray-900 w-full text-xs break-words md:text-sm",
                            "[&_ol]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 last:[&_p]:mb-0 [&_ul]:ml-4 [&_ul]:list-disc",
                            "[&_*]:break-words [&_*]:whitespace-normal [&_*]:text-gray-900"
                          )}
                          dangerouslySetInnerHTML={{ __html: safeHtml }}
                        />
                      ) : (
                        <p
                          className={cn(
                            "text-gray-900 inline w-full text-xs break-words md:text-sm"
                          )}
                        >
                          {previewContent}
                        </p>
                      )}

                      {/* Recommended Toolkit - Now inside content area, shows when expanded */}
                      {(isContentExpanded || !hasLongContent) &&
                      post.recommendedToolkit?.id ? (
                        <div className="mt-4 mb-2">
                          <div className="bg-orange-50/50 border-orange-200 group relative flex flex-col gap-2 rounded-xl border p-2 transition-all hover:bg-orange-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="bg-orange-100 flex h-5 w-5 items-center justify-center rounded-full">
                                  <Flame className="h-3 w-3 text-orange-600" />
                                </div>
                                <span className="text-[9px] font-bold tracking-wider text-orange-600 uppercase">
                                  Recommended Toolkit
                                </span>
                              </div>
                            </div>

                            <Link
                              href={`/toolkit/${post.recommendedToolkit.id}`}
                              className="flex gap-2.5"
                            >
                              {post.recommendedToolkit.coverImageUrl && (
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border shadow-sm sm:h-14 sm:w-14">
                                  <Image
                                    src={post.recommendedToolkit.coverImageUrl}
                                    alt={post.recommendedToolkit.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                  />
                                </div>
                              )}
                              <div className="flex flex-1 flex-col justify-center gap-0.5">
                                <h4 className="text-foreground line-clamp-1 text-xs font-bold leading-tight transition-colors group-hover:text-orange-600">
                                  {post.recommendedToolkit.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {post.recommendedToolkit.price !== null && (
                                    <span className="text-xs font-black text-orange-600">
                                      ₹{post.recommendedToolkit.price}
                                    </span>
                                  )}
                                  {post.recommendedToolkit.originalPrice && (
                                    <span className="text-muted-foreground text-[9px] line-through decoration-muted-foreground/50">
                                      ₹{post.recommendedToolkit.originalPrice}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="bg-orange-600 text-white self-center rounded-full p-1 shadow-md transition-transform group-hover:scale-110 group-active:scale-95">
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {hasLongContent && !isContentExpanded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary mt-0.5 ml-1 inline h-auto p-0 text-xs hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            posthog.capture("ungatekeep_read_more_clicked", {
                              post_id: postId,
                            });
                            setIsContentExpanded(true);
                          }}
                        >
                          Read more
                        </Button>
                      )}
                      {hasLongContent && isContentExpanded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary mt-0.5 -ml-1 h-auto p-0 text-xs hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsContentExpanded(false);
                          }}
                        >
                          Show less
                        </Button>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Link Preview */}
              {(isContentExpanded ||
                plainTextContent.length <= 150) &&
              post.linkUrl &&
              mediaItems.length > 0 ? (
                <div className="space-y-3 border-t px-3 pt-2 pb-3">
                  <div className="hover:bg-muted/50 overflow-hidden rounded-lg border transition-colors">
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
                </div>
              ) : (
                (isContentExpanded ||
                  plainTextContent.length <= 150) &&
                post.linkUrl && (
                  <div className="mt-4 overflow-hidden rounded-lg border hover:bg-muted/50 transition-colors">
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
                )
              )}

              {/* Post Action Bar & Comments */}
              <UngatekeepPostActionBar
                postId={postId}
                postTag={post.tag}
                initialScore={post.score ?? 0}
                initialUserVote={post.userVote ?? 0}
                commentCount={post.commentCount ?? 0}
                isSaved={isSaved}
                showComments={showComments}
                askQueryHref={askQueryHref}
                isPinned={post.isPinned}
                onSaveClick={toggleSave}
                isFlying={isFlying}
                flyPos={flyPos}
                onCommentClick={() => {
                  const newState = !showComments;
                  setShowComments(newState);
                  if (newState) {
                    posthog.capture("ungatekeep_comments_opened", {
                      post_id: postId,
                      post_tag: post.tag,
                    });
                  }
                }}
              />
              {showComments && (
                <UngatekeepCommentSection postId={postId} />
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
