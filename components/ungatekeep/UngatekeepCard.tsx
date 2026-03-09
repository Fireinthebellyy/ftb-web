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
  Bookmark,
  ExternalLink,
  MessageCircleQuestion,
  Share2,
  Pin,
} from "lucide-react";
import { toast } from "sonner";
import { ShareDialog } from "./ShareDialog";
import { createUngatekeepStorage } from "@/lib/appwrite";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { motion, AnimatePresence } from "framer-motion";

dayjs.extend(relativeTime);

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

const CONTENT_PREVIEW_LENGTH = 150;

const WHATSAPP_NUMBER = "917014885565";

export default function UngatekeepCard({ post }: UngatekeepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyPos, setFlyPos] = useState({ x: 0, y: 0 });
  const ungatekeepStorage = createUngatekeepStorage();
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check if post is saved in localStorage
    const savedPosts = JSON.parse(localStorage.getItem("ungatekeep_saved") || "[]");
    setIsSaved(savedPosts.some((p: any) => p.id === post.id));
  }, [post.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const savedPosts = JSON.parse(localStorage.getItem("ungatekeep_saved") || "[]");
    
    if (isSaved) {
      // Remove from saved
      const updatedPosts = savedPosts.filter((p: any) => p.id !== post.id);
      localStorage.setItem("ungatekeep_saved", JSON.stringify(updatedPosts));
      setIsSaved(false);
      toast.success("Post removed from saved");
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent("ungatekeep-post-saved", { detail: { postId: post.id, action: "unsave" } }));
    } else {
      // Add to saved
      const updatedPosts = [...savedPosts, post];
      localStorage.setItem("ungatekeep_saved", JSON.stringify(updatedPosts));
      setIsSaved(true);
      
      // Get click position for animation
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setFlyPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setIsFlying(true);
      
      toast.success("Post saved successfully");
      
      // Trigger animation event
      window.dispatchEvent(new CustomEvent("ungatekeep-post-saved", { detail: { postId: post.id } }));
      
      // Reset flying state after animation
      setTimeout(() => setIsFlying(false), 800);
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

  const askQueryWhatsAppUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Type: Ungatekeep post query\nSource: ${shareUrl}\n\nPost: ${post.title || post.content.slice(0, 100)}...\n\nMy question:`
  )}`;

  const getTagBadgeVariant = (tag: string | null | undefined) => {
    switch (tag) {
      case "announcement":
        return "bg-blue-200 text-blue-600";
      case "company_experience":
        return "bg-orange-200 text-orange-600";
      case "resources":
        return "bg-green-200 text-green-600";
      default:
        return "bg-yellow-200 text-yellow-600";
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

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  };

  const hasLongContent = post.content.length > CONTENT_PREVIEW_LENGTH;
  const hasExtraMedia =
    (post.images && post.images.length > 1) || !!post.linkUrl;
  const canExpand = hasLongContent || hasExtraMedia;
  const previewContent =
    hasLongContent && !isExpanded
      ? `${post.content.slice(0, CONTENT_PREVIEW_LENGTH).trim()}...`
      : post.content;

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
      <div className="px-3 pt-5 sm:pt-6 pb-3">
        <p
          className={cn(
            "text-xs md:text-sm text-muted-foreground leading-tight whitespace-pre-wrap",
            !isExpanded && hasLongContent && "inline"
          )}
        >
          {previewContent}
        </p>
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
        {post.images && post.images.length > 0 && (
          <div className="mt-3">
            {post.images.length === 1 ? (
              <div className="relative aspect-[9/16] max-h-[260px] w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={getImageUrl(post.images[0])}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="px-1">
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2">
                    {post.images.map((imageId, idx) => (
                      <CarouselItem key={idx} className="basis-[75%] pl-2 sm:basis-[65%]">
                        <div className="relative aspect-[9/16] max-h-[260px] w-full overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={getImageUrl(imageId)}
                            alt={`${post.title} - Image ${idx + 1}`}
                            fill
                            className="object-cover"
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
        {!post.images?.length && post.linkUrl && post.linkImage && (
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

      {/* Expanded content - link preview (only when post has images; link preview already shown above when no images) */}
      {isExpanded &&
        post.images &&
        post.images.length > 0 &&
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
                  title={post.title || post.content.slice(0, 80)}
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
