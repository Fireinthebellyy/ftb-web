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
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  FileText,
  Bookmark,
  ExternalLink,
  MessageCircleQuestion,
  Share2,
  Pin,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { ShareDialog } from "./ShareDialog";
import { createUngatekeepStorage, getUngatekeepBucketId } from "@/lib/appwrite";
import { cn, stripHtml } from "@/lib/utils";
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

const WHATSAPP_NUMBER = "917014885565";

function AttachmentSlide({
  imageId,
  postTitle,
  idx,
  ungatekeepStorage,
}: {
  imageId: string;
  postTitle: string;
  idx?: number;
  ungatekeepStorage: any;
}) {
  const [error, setError] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const bucketId = getUngatekeepBucketId();
  
  useEffect(() => {
    if (bucketId && imageId) {
      ungatekeepStorage.getFile(bucketId, imageId)
        .then((info: any) => {
          setFileInfo(info);
          // We don't necessarily want to set error to true for PDFs anymore
          // because we'll try to show a preview
        })
        .catch(() => {
          setError(true);
        });
    }
  }, [bucketId, imageId, ungatekeepStorage]);

  if (!bucketId) return null;

  const isPdf = fileInfo?.mimeType === "application/pdf";
  const fileName = fileInfo?.name || `Document ${idx !== undefined ? idx + 1 : ""}`;
  
  // Use getFilePreview for PDFs to show the first page as a thumbnail
  const displayUrl = isPdf 
    ? ungatekeepStorage.getFilePreview(bucketId, imageId, 600, 800).toString()
    : ungatekeepStorage.getFileView(bucketId, imageId).toString();

  const fullUrl = ungatekeepStorage.getFileView(bucketId, imageId).toString();

  if (error) {
    return (
      <div className="group relative flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/50 p-4 transition-colors hover:bg-muted/80">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-background shadow-sm">
          <FileText className="h-10 w-10 text-blue-500" />
        </div>
        
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-xs font-semibold text-foreground line-clamp-2 px-2">
            {fileName}
          </span>
        </div>

        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[11px] font-medium text-primary-foreground shadow-sm transition-transform active:scale-95 hover:bg-primary/90"
        >
          <ExternalLink className="h-3 w-3" />
          View Document
        </a>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="relative h-full w-full group overflow-hidden">
        {/* Try to show PDF content using an iframe for a real "inside" look */}
        <iframe
          src={`${fullUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          className="h-full w-full border-none pointer-events-none scale-[1.01]"
          title={fileName}
        />
        
        <div className="absolute inset-0 flex flex-col items-end justify-start p-2 opacity-0 transition-opacity group-hover:opacity-100 bg-black/5">
          <div className="flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white uppercase shadow-sm">
            <FileText className="h-3 w-3" />
            PDF
          </div>
        </div>

        {/* Overlay to make it clickable and prevent iframe interaction */}
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 cursor-pointer"
          title="Open full document"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full group">
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

import { useQueryClient } from "@tanstack/react-query";

export default function UngatekeepCard({ post }: UngatekeepCardProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyPos, setFlyPos] = useState({ x: 0, y: 0 });
  const ungatekeepStorage = createUngatekeepStorage();
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
        if (response.data && typeof response.data.bookmarked === 'boolean') {
          const newSavedStatus = response.data.bookmarked;
          // The optimistic update is reverted/confirmed, so we set the state from the server response.
          setIsSaved(newSavedStatus);

          if (newSavedStatus) {
            const rect = buttonElement.getBoundingClientRect();
            setFlyPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            setIsFlying(true);
            toast.success("Post saved successfully");
            setTimeout(() => setIsFlying(false), 800);
          } else {
            toast.success("Post removed from saved");
          }

          // Invalidate queries to refetch data, which replaces the old localStorage logic.
          queryClient.invalidateQueries({ queryKey: ["ungatekeep"] });
          queryClient.invalidateQueries({ queryKey: ["ungatekeep-saved-count"] });
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

  const hasLongContent = plainTextContent.length > CONTENT_PREVIEW_LENGTH;
  const hasExtraMedia =
    (post.attachments && post.attachments.length > 0) || (!!post.linkUrl && !!post.linkImage);
  const canExpand = hasLongContent || hasExtraMedia;

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

  return (
    <article
      ref={cardRef}
      id={`post-${post.id}`}
      className="relative rounded-lg border bg-card transition-colors"
    >
      {post.tag && (
        <div className="absolute sm:-top-1 -top-1.5 right-0 z-10">
          <Badge
            className={`${getTagBadgeVariant(post.tag)} rounded-tl-none rounded-br-none sm:px-2 px-1.5 sm:py-1 py-0.5 sm:text-[10px] text-[9px] font-medium`}
          >
            {post.tag.replace("_", " ")}
          </Badge>
        </div>
      )}

      {/* Content - no title */}
      <div className="w-full px-3 pt-5 sm:pt-6 pb-3 overflow-hidden text-left leading-[0.9]">
        {isExpanded || !hasLongContent ? (
          <div
            className={cn(
              "w-full text-xs md:text-sm text-muted-foreground break-words",
              "[&_p]:mb-2 last:[&_p]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4",
              "[&_*]:break-words [&_*]:whitespace-normal"
            )}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <p
            className={cn(
              "w-full text-xs md:text-sm text-muted-foreground inline break-words"
            )}
          >
            {previewContent}
          </p>
        )}
        {canExpand && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 mt-0.5 text-xs text-primary hover:text-primary hover:bg-transparent ml-1 inline"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
          >
            Read more
          </Button>
        )}
        {canExpand && isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 mt-0.5 text-xs text-primary hover:text-primary hover:bg-transparent -ml-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
          >
            Show less
          </Button>
        )}

        {/* Image / Link preview - below text (LinkedIn style) */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-3">
            {post.attachments.length === 1 ? (
              <div className="relative aspect-[9/16] max-h-[300px] w-full overflow-hidden rounded-lg bg-muted border">
                <AttachmentSlide
                  imageId={post.attachments[0]}
                  postTitle={plainTextContent.slice(0, 50)}
                  ungatekeepStorage={ungatekeepStorage}
                />
              </div>
            ) : (
              <div className="px-1">
                <Carousel
                  className="w-full"
                  opts={{ align: "start", loop: false }}
                >
                  <CarouselContent className="-ml-2">
                    {post.attachments.map((fileId, idx) => (
                      <CarouselItem
                        key={idx}
                        className="basis-[85%] pl-2 sm:basis-[75%]"
                      >
                        <div className="relative aspect-[9/16] max-h-[300px] w-full overflow-hidden rounded-lg bg-muted border">
                          <AttachmentSlide
                            imageId={fileId}
                            postTitle={plainTextContent.slice(0, 50)}
                            idx={idx}
                            ungatekeepStorage={ungatekeepStorage}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}
          </div>
        )}
        {!post.attachments?.length && post.linkUrl && post.linkImage && (
          <div className="mt-3 overflow-hidden rounded-lg border hover:bg-muted/50 transition-colors">
            <Link
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <Image
                  src={post.linkImage}
                  alt={post.linkTitle || "Link preview"}
                  fill
                  className="object-cover"
                />
              </div>
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
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Expanded content - link preview (already shown above when no attachments) */}
      {isExpanded &&
        post.attachments &&
        post.attachments.length > 0 &&
        post.linkUrl && (
          <div className="border-t px-3 pb-3 pt-2 space-y-3">
            <div className="overflow-hidden rounded-lg border hover:bg-muted/50 transition-colors">
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
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            </div>
          </div>
        )}

      {/* Action bar - Share, Ask query, Save (LinkedIn style) */}
      <footer className="flex items-center border-t px-3 py-2">
        <div className="flex w-full items-center justify-between text-muted-foreground">
          {/* Left side - Date and Time */}
          <div className="flex items-center gap-1.5 sm:text-[12px] text-[10px] text-muted-foreground/80">
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
                className="flex items-center gap-1 py-1 text-xs transition-colors hover:text-primary"
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
              className="flex items-center gap-1 py-1 text-xs transition-colors hover:text-primary"
            >
              <MessageCircleQuestion className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ask query</span>
            </Link>

            <button
              type="button"
              title={isSaved ? "Remove from saved" : "Save"}
              aria-label={isSaved ? "Remove from saved" : "Save"}
              onClick={toggleSave}
              className={cn(
              "relative flex items-center gap-1 py-1 text-xs transition-colors hover:text-primary",
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
                    rotate: 45
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeIn" }}
                  className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg"
                  style={{
                    transform: "translate(-50%, -50%)"
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
