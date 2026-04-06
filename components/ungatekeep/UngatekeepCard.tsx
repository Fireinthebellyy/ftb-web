"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  FileText,
  Bookmark,
  ExternalLink,
  Share2,
  Pin,
} from "lucide-react";
import axios from "axios";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

import { toast } from "sonner";
import { ShareDialog } from "./ShareDialog";
import { cn, stripHtml } from "@/lib/utils";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { motion, AnimatePresence } from "framer-motion";

dayjs.extend(relativeTime);

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
};

interface UngatekeepCardProps {
  post: UngatekeepPost;
}

const CONTENT_PREVIEW_LENGTH = 150;

const WHATSAPP_NUMBER = "916377492042";

function AttachmentSlide({
  imageId,
  postTitle,
  idx,
  onClick,
}: {
  imageId: string;
  postTitle: string;
  idx?: number;
  onClick?: () => void;
}) {
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(
      typeof window !== "undefined" &&
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }, []);

  const lower = imageId.toLowerCase();
  const isPdf = lower.endsWith(".pdf");
  const fileName = `Document ${idx !== undefined ? idx + 1 : ""}`;
  const displayUrl = tryGetStoragePublicUrl("ungatekeep-images", imageId);
  const fullUrl = displayUrl;

  if (error) {
    return (
      <div className="group bg-muted/50 hover:bg-muted/80 relative flex h-full w-full flex-col items-center justify-center gap-3 p-4 transition-colors">
        <div className="bg-background relative flex h-16 w-16 items-center justify-center rounded-xl shadow-sm">
          <FileText className="h-10 w-10 text-blue-500" />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-foreground line-clamp-2 px-2 text-xs font-semibold">
            {fileName}
          </span>
        </div>

        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-medium shadow-sm transition-transform active:scale-95"
        >
          <ExternalLink className="h-3 w-3" />
          View Document
        </a>
      </div>
    );
  }

  if (isPdf) {
    // Some mobile browsers don't support embedding PDF in iframe directly.
    // We use Google Docs Viewer for a consistent experience on mobile.
    if (isMobile === null) {
      return (
        <div className="relative h-full w-full bg-muted animate-pulse" />
      );
    }

    const pdfSrc = isMobile
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`
      : `${fullUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;

    return (
      <div className="relative h-full w-full group overflow-hidden bg-white">
        {/* PDF content with interaction enabled for scrolling */}
        <iframe
          src={pdfSrc}
          className="h-full w-full border-none"
          title={fileName}
        />

        {/* Small "Open Full" button that doesn't block scrolling */}
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-primary shadow-md hover:bg-white transition-colors border sm:h-8 sm:w-8"
          title="Open full document"
        >
          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </a>
      </div>
    );
  }

  return (
    <div 
      className="group relative h-full w-full cursor-pointer"
      onClick={onClick}
    >
      <Image
        src={displayUrl}
        alt={idx !== undefined ? `${postTitle} - Item ${idx + 1}` : postTitle}
        fill
        className="object-cover"
        unoptimized={true}
        onError={() => setError(true)}
      />
    </div>
  );
}

function ImageModal({
  attachments,
  postTitle,
  modalIndex,
}: {
  attachments: string[];
  postTitle: string;
  modalIndex: number;
}) {
  const [carouselApi, setCarouselApi] = useState<any>(null);

  useEffect(() => {
    if (carouselApi) {
      setTimeout(() => carouselApi.scrollTo(modalIndex), 0);
    }
  }, [modalIndex, carouselApi]);

  const images = attachments.filter(id => !id.toLowerCase().endsWith(".pdf"));

  if (images.length <= 1) {
    const fileId = images[0] || attachments[modalIndex];
    return (
      <div className="flex items-center justify-center p-0">
        <Image
          src={tryGetStoragePublicUrl("ungatekeep-images", fileId)}
          alt={postTitle}
          className="max-h-[85vh] w-full object-contain"
          height={1200}
          width={1200}
          unoptimized={true}
        />
      </div>
    );
  }

  return (
    <Carousel className="w-full" setApi={setCarouselApi}>
      <CarouselContent>
        {images.map((fileId, idx) => (
          <CarouselItem key={idx}>
            <div className="flex h-full items-center justify-center bg-transparent">
              <Image
                src={tryGetStoragePublicUrl("ungatekeep-images", fileId)}
                alt={`${postTitle} - Image ${idx + 1}`}
                className="max-h-[85vh] w-full object-contain"
                height={1200}
                width={1200}
                unoptimized={true}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselDots className="mt-4" />
    </Carousel>
  );
}

import { useQueryClient } from "@tanstack/react-query";

export default function UngatekeepCard({ post }: UngatekeepCardProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyPos, setFlyPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsSaved(post.isSaved || false);
  }, [post.isSaved]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const buttonElement = e.currentTarget as HTMLElement;

    // Optimistic UI update
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);

    try {
      const response = await axios.post("/api/ungatekeep/bookmark", {
        postId: post.id,
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

  const publicBaseUrl =
    (typeof window !== "undefined" ? window.location.origin : "") ||
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    "";
  const shareUrl = publicBaseUrl
    ? `${publicBaseUrl}/ungatekeep/${post.id}`
    : `/ungatekeep/${post.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const plainTextContent = stripHtml(post.content);

  const askQueryWhatsAppUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Type: Ungatekeep post query\nSource: ${shareUrl}\n\nPost: ${plainTextContent.slice(0, 100)}...\n\nMy question:`
  )}`;

  const getTagBadgeVariant = (tag: string | null | undefined) => {
    switch (tag) {
      case "announcement":
        return "bg-blue-200 text-blue-600";
      case "company_experience":
        return "bg-orange-200 text-orange-600";
      case "resources":
        return "bg-green-200 text-green-600";
      case "playbooks":
        return "bg-purple-200 text-purple-600";
      case "college_hacks":
        return "bg-pink-200 text-pink-600";
      case "interview":
        return "bg-red-200 text-red-600";
      case "ama_drops":
        return "bg-indigo-200 text-indigo-600";
      case "ftb_recommends":
        return "bg-teal-200 text-teal-600";
      default:
        return "bg-yellow-200 text-yellow-600";
    }
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

  const hasLongContent = plainTextContent.length > CONTENT_PREVIEW_LENGTH;

  const previewContent =
    hasLongContent && !isExpanded
      ? `${plainTextContent.slice(0, CONTENT_PREVIEW_LENGTH).trim()}...`
      : post.content;

  const [safeHtml, setSafeHtml] = useState(() =>
    typeof window !== "undefined" ? DOMPurify.sanitize(post.content) : ""
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSafeHtml(DOMPurify.sanitize(post.content));
    }
  }, [post.content]);

  const youtubeEmbedUrl = getYouTubeEmbedUrl(post.videoUrl);

  const mediaItems: ({ type: "attachment"; id: string } | { type: "video"; url: string })[] = [
    ...(post.attachments || []).map((id) => ({ type: "attachment" as const, id })),
    ...(youtubeEmbedUrl ? [{ type: "video" as const, url: youtubeEmbedUrl }] : []),
  ];

  return (
    <article
      ref={cardRef}
      id={`post-${post.id}`}
      className="bg-card relative rounded-lg border transition-colors"
    >
      {post.tag && (
        <div className="absolute -top-1.5 right-0 z-10 sm:-top-1">
          <Badge
            className={`${getTagBadgeVariant(post.tag)} rounded-tl-none rounded-br-none px-1.5 py-0.5 text-[9px] font-medium sm:px-2 sm:py-1 sm:text-[10px]`}
          >
            {post.tag.replace("_", " ")}
          </Badge>
        </div>
      )}

      {/* Content - no title */}
      <div className="w-full overflow-hidden px-3 pt-5 pb-3 text-left leading-[0.9] sm:pt-6">
        {isExpanded || !hasLongContent ? (
          <div
            className={cn(
              "text-muted-foreground w-full text-xs break-words md:text-sm",
              "[&_ol]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 last:[&_p]:mb-0 [&_ul]:ml-4 [&_ul]:list-disc",
              "[&_*]:break-words [&_*]:whitespace-normal"
            )}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <p
            className={cn(
              "text-muted-foreground inline w-full text-xs break-words md:text-sm"
            )}
          >
            {previewContent}
          </p>
        )}
        {hasLongContent && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary mt-0.5 ml-1 inline h-auto p-0 text-xs hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
          >
            Read more
          </Button>
        )}
        {hasLongContent && isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary mt-0.5 -ml-1 h-auto p-0 text-xs hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
          >
            Show less
          </Button>
        )}

        {/* Media (Images, PDFs, Video) - LinkedIn style below text */}
        {mediaItems.length > 0 && (
          <div className="mt-3">
            {mediaItems.length === 1 ? (
              <div className="relative aspect-square max-h-[400px] w-full overflow-hidden rounded-lg bg-muted border">
                {mediaItems[0].type === "attachment" ? (
                  <AttachmentSlide
                    imageId={mediaItems[0].id}
                    postTitle={plainTextContent.slice(0, 50)}
                    onClick={() => {
                      const item = mediaItems[0];
                      if (item.type === "attachment" && !item.id.toLowerCase().endsWith(".pdf")) {
                        setModalIndex(0);
                        setModalOpen(true);
                      }
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-black">
                    <iframe
                      src={mediaItems[0].url}
                      title="YouTube video player"
                      className="absolute inset-0 h-full w-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
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
                              postTitle={plainTextContent.slice(0, 50)}
                              idx={idx}
                              onClick={() => {
                                if (item.type === "attachment" && !item.id.toLowerCase().endsWith(".pdf")) {
                                  // Find the index in the filtered images list
                                  const imagesOnly = mediaItems.filter(mi => mi.type === "attachment" && !mi.id.toLowerCase().endsWith(".pdf"));
                                  const imgIdx = imagesOnly.findIndex(mi => mi.type === "attachment" && mi.id === item.id);
                                  setModalIndex(imgIdx >= 0 ? imgIdx : 0);
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
                  {/* Show navigation buttons only when more than 1 item is present */}
                  {mediaItems.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2 h-7 w-7 sm:h-8 sm:w-8 bg-orange-500 text-white hover:bg-orange-600 hover:text-white border-none shadow-md z-20 [&_svg]:size-4" />
                      <CarouselNext className="right-2 h-7 w-7 sm:h-8 sm:w-8 bg-orange-500 text-white hover:bg-orange-600 hover:text-white border-none shadow-md z-20 [&_svg]:size-4" />
                    </>
                  )}
                </Carousel>
              </div>
            )}
          </div>
        )}

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent
            className="mx-auto min-w-auto p-0 md:min-w-3xl border-none bg-transparent shadow-none"
            overlayClassName="bg-black/90 backdrop-blur-sm"
          >
            <ImageModal
              attachments={post.attachments || []}
              postTitle={plainTextContent.slice(0, 50)}
              modalIndex={modalIndex}
            />
          </DialogContent>
        </Dialog>

        {mediaItems.length === 0 && post.linkUrl && (
          <div className="mt-3 overflow-hidden rounded-lg border hover:bg-muted/50 transition-colors">
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
      </div>

      {/* Expanded content - link preview (already shown above when no attachments/video) */}
      {isExpanded &&
        mediaItems.length > 0 &&
        post.linkUrl && (
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
        )}

      {/* Action bar - Share, Ask query, Save (LinkedIn style) */}
      <footer className="flex items-center border-t px-3 py-2">
        <div className="text-muted-foreground flex w-full items-center justify-between">
          {/* Left side - Date and Time */}
          <div className="text-muted-foreground/80 flex items-center gap-1.5 text-[10px] sm:text-[12px]">
            <span>
              {post.publishedAt
                ? dayjs(post.publishedAt).format("DD MMM YYYY • hh:mm A")
                : dayjs(post.createdAt).format("DD MMM YYYY • hh:mm A")}
            </span>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {post.isPinned && (
              <div
                title="Pinned post"
                className="flex items-center gap-1 text-yellow-500"
              >
                <Pin className="h-3.5 w-3.5 fill-yellow-500" />
                <span className="hidden text-[10px] font-medium sm:inline">
                  Pinned
                </span>
              </div>
            )}

            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <button
                type="button"
                title="Share"
                aria-label="Share"
                onClick={() => setShareDialogOpen(true)}
                className="flex cursor-pointer items-center gap-1 py-1 text-xs text-black transition-colors hover:text-black/70"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <DialogContent>
                <ShareDialog
                  shareUrl={shareUrl}
                  title={plainTextContent.slice(0, 80)}
                  onCopy={handleCopy}
                />
              </DialogContent>
            </Dialog>

            <Link
              href={askQueryWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ask query on WhatsApp"
              aria-label="Ask query"
              className="flex items-center gap-1 py-1 text-xs text-black transition-colors hover:text-black/70"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ask query</span>
            </Link>

            <button
              type="button"
              title={isSaved ? "Remove from saved" : "Save"}
              aria-label={isSaved ? "Remove from saved" : "Save"}
              onClick={toggleSave}
              className={cn(
                "relative flex cursor-pointer items-center gap-1 py-1 text-xs text-black transition-colors hover:text-primary",
                isSaved && "text-primary"
              )}
            >
              <Bookmark
                className={cn("h-3.5 w-3.5", isSaved && "fill-primary")}
              />
              <AnimatePresence>
                {isFlying && (
                  <motion.div
                    initial={{ opacity: 1, x: flyPos.x, y: flyPos.y, scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: window.innerWidth - 100,
                      y: 50,
                      scale: 0.2,
                      rotate: 45,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeIn" }}
                    className="bg-primary pointer-events-none fixed left-0 top-0 z-[9999] flex h-6 w-6 items-center justify-center rounded-full text-white shadow-lg"
                    style={{
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <Bookmark className="h-4 w-4 fill-white" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="hidden sm:inline">
                {isSaved ? "Saved" : "Save"}
              </span>
            </button>
          </div>
        </div>
      </footer>
    </article>
  );
}
