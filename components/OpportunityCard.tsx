"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Bookmark,
  MessageSquare,
  Building2,
  Loader2,
  Share2,
  Flame,
  ChevronDown,
} from "lucide-react";
import TwitterXIcon from "@/components/icons/TwitterX";
import FacebookIcon from "@/components/icons/Facebook";
import LinkedInIcon from "@/components/icons/LinkedIn";
import WhatsAppIcon from "@/components/icons/WhatsApp";
import EnvelopeIcon from "@/components/icons/Envelope";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { createOpportunityStorage } from "@/lib/appwrite";
import Image from "next/image";
import { OpportunityPostProps } from "@/types/interfaces";
import {
  useOpportunity,
  useToggleUpvote,
  useIsBookmarked,
} from "@/lib/queries";
import Link from "next/link";
import axios from "axios";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import CommentSection from "@/components/opportunity/CommentSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const OpportunityPost: React.FC<OpportunityPostProps> = ({
  opportunity,
  onBookmarkChange,
  isCardExpanded = false,
}) => {
  const {
    id,
    type,
    tags,
    title,
    description,
    images = [],
    organiserInfo,
    createdAt,
    location,
    startDate,
    endDate,
    user,
  } = opportunity;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(isCardExpanded);

  const { data: session } = authClient.useSession();
  const { data, isLoading } = useOpportunity(id);
  const toggleUpvote = useToggleUpvote(id);

  const { data: isBookmarkedServer } = useIsBookmarked(id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof isBookmarkedServer === "boolean") {
      setIsBookmarked(isBookmarkedServer);
    }
  }, [isBookmarkedServer]);

  useEffect(() => {
    if (showMessage) {
      toast.success(
        isBookmarked ? "Added to bookmarks" : "Removed from bookmarks"
      );
      const timer = setTimeout(() => setShowMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showMessage, isBookmarked]);

  const handleBookmark = async (): Promise<void> => {
    if (isBookmarkLoading) return;

    if (!session?.user?.id) {
      toast.error("Please log in to bookmark opportunities");
      return;
    }

    if (!isValidUUID(id)) {
      console.error("Invalid opportunity ID format");
      return;
    }

    const currentUserId = session.user.id as string;
    const newBookmarkState = !isBookmarked;

    setIsBookmarkLoading(true);

    try {
      if (newBookmarkState) {
        const response = await axios.post("/api/bookmarks", {
          userId: currentUserId,
          opportunityId: id,
        });

        if (response.data?.message === "Already bookmarked") {
          toast.info("Already bookmarked");
        }
      } else {
        await axios.delete("/api/bookmarks", {
          data: {
            userId: currentUserId,
            opportunityId: id,
          },
        });
      }

      setIsBookmarked(newBookmarkState);

      if (onBookmarkChange) {
        onBookmarkChange(id, newBookmarkState);
      }

      queryClient.invalidateQueries({ queryKey: ["bookmark", id] });

      setShowMessage(true);
    } catch (err) {
      console.error("Bookmark request failed:", err);
      toast.error("Failed to update bookmark");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const primaryType = Array.isArray(type) ? type[0] : type;

  const isMobile = useIsMobile();
  const needsExpand =
    images.length > 0 ||
    (description &&
      typeof description === "string" &&
      description.length > (isMobile ? 50 : 100));

  const getTypeColor = (type?: string): string => {
    const colors: Record<string, string> = {
      hackathon: "bg-blue-100 text-blue-800",
      grant: "bg-green-100 text-green-800",
      competition: "bg-purple-100 text-purple-800",
      ideathon: "bg-orange-100 text-orange-800",
      others: "bg-gray-100 text-gray-800",
    };
    return colors[type?.toLowerCase() || "others"] || colors.others;
  };

  const opportunityStorage = createOpportunityStorage();

  const upvotes = data?.upvotes ?? (opportunity as any)?.upvoteCount ?? 0;
  const userUpvoted =
    data?.hasUserUpvoted ??
    ((opportunity as any)?.userHasUpvoted as boolean | undefined) ??
    false;

  const onUpvoteClick = () => {
    if (!toggleUpvote.isPending) {
      toggleUpvote.mutate();
    }
  };

  const publicBaseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = publicBaseUrl
    ? `${publicBaseUrl}/opportunities/${id}`
    : `/opportunities/${id}`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Extract first URL from description
  const firstUrl = useMemo(() => {
    if (!description || typeof description !== "string") return null;
    const urlRegex = /https?:\/\/[^\s<>"'`|\\^{}\[\]]+/gi;
    const match = description.match(urlRegex);
    if (!match) return null;
    let url = match[0].trim();
    url = url.replace(/[),.;:!?]+$/g, "");
    const openCount = (url.match(/\(/g) || []).length;
    const closeCount = (url.match(/\)/g) || []).length;
    if (closeCount > openCount) url = url.replace(/\)+$/g, "");
    return url;
  }, [description]);

  const [meta, setMeta] = useState<{
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
  } | null>(null);
  const [_metaLoading, setMetaLoading] = useState(false);
  const [_metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    async function fetchMeta() {
      setMetaError(null);
      setMeta(null);

      if (images.length > 0) return;
      if (!firstUrl) return;
      setMetaLoading(true);
      try {
        const response = await axios.post("/api/og-meta", { description });
        const data = response.data;
        if (aborted) return;

        if (!data?.ok) {
          setMetaError(
            data?.error === "NO_URL_IN_DESCRIPTION"
              ? null
              : "Failed to fetch metadata"
          );
          setMeta(null);
          return;
        }

        setMeta(
          data?.meta
            ? {
                ...data.meta,
                url: data?.url,
              }
            : null
        );
      } catch (_e) {
        if (!aborted) {
          setMetaError("Failed to fetch metadata");
          setMeta(null);
        }
      } finally {
        if (!aborted) setMetaLoading(false);
      }
    }

    if (!images.length) fetchMeta();

    return () => {
      aborted = true;
    };
  }, [description, firstUrl, images.length]);

  return (
    <article className="relative mb-3 w-full rounded-lg border bg-white shadow-sm sm:mb-4">
      <header className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex-shrink-0">
          {user &&
          user.image &&
          !user.image.includes("https://media.licdn.com") ? (
            <Avatar className="size-6 sm:size-7">
              <AvatarImage
                src={user.image}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            </Avatar>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-gray-600 uppercase sm:h-12 sm:w-12">
              {user && user.name
                ? user.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                : "OP"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {user && user.name ? user.name : "Opportunity Organizer"}
          </p>
          <p className="text-xs text-gray-500">
            {createdAt ? formatDate(createdAt) : ""}
          </p>
        </div>

        <div className="ml-auto flex flex-col items-end gap-1 text-xs text-gray-600">
          {(startDate || endDate) && (
            <div className="flex items-baseline gap-1">
              <CalendarDays className="size-3" />
              <span className="text-xs">
                {startDate && format(new Date(startDate), "MMM dd")}
                {startDate && endDate && (
                  <>
                    {" - "}
                    {format(new Date(startDate), "MMM") ===
                    format(new Date(endDate), "MMM")
                      ? format(new Date(endDate), "dd")
                      : format(new Date(endDate), "MMM dd")}
                  </>
                )}
                {!startDate && endDate && format(new Date(endDate), "MMM dd")}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="absolute -top-3 -right-1.5 z-10">
        <Badge
          className={`${getTypeColor(
            primaryType
          )} px-2 py-1 text-xs text-[10px] font-medium sm:text-xs`}
        >
          {primaryType?.charAt(0).toUpperCase() + primaryType?.slice(1)}
        </Badge>
      </div>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <h2 className="mb-2 line-clamp-1 truncate text-base leading-tight font-bold text-gray-900 sm:text-lg">
          {title}
        </h2>

        {description && (
          <div
            className={`text-sm leading-relaxed text-gray-700 ${
              !isExpanded ? "mb-2 line-clamp-1 overflow-hidden" : "mb-3"
            }`}
          >
            <p>
              {typeof description === "string"
                ? description
                    .split(/(https?:\/\/[^\s<>"'`|\\^{}\[\]]+)/gi)
                    .map((part, index) => {
                      if (part.match(/^https?:\/\/[^\s<>"'`|\\^{}\[\]]+$/i)) {
                        return (
                          <Link
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={index}
                            className="text-gray-400"
                          >
                            {part}
                          </Link>
                        );
                      }
                      return part;
                    })
                : description}
            </p>
          </div>
        )}

        {isExpanded && !(images.length > 0) && meta && (
          <Link href={meta?.url} target="_blank" rel="noopener noreferrer">
            <div className="mb-3 flex flex-col rounded border border-gray-300 p-2 shadow-sm">
              {meta.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meta.image}
                  alt={meta.title}
                  className="h-auto w-full rounded"
                />
              )}
              <h3 className="mt-2 text-sm font-semibold">{meta.title}</h3>
              <p className="text-sm text-gray-600">{meta.description}</p>
            </div>
          </Link>
        )}

        {isExpanded && images.length > 0 ? (
          images.length === 1 ? (
            <div className="mb-3 overflow-hidden rounded">
              <Image
                src={opportunityStorage.getFileView(
                  process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
                  images[0]
                )}
                alt={title}
                className="max-h-48 w-full object-contain sm:max-h-64"
                loading="lazy"
                height={256}
                width={400}
              />
            </div>
          ) : (
            <div className="mb-3">
              <Carousel className="w-full">
                <CarouselContent>
                  {images.map((image, i) => (
                    <CarouselItem key={i}>
                      <div className="overflow-hidden rounded">
                        <Image
                          src={opportunityStorage.getFileView(
                            process.env
                              .NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
                            image
                          )}
                          alt={`${title} - Image ${i + 1}`}
                          className="max-h-48 w-full object-contain sm:max-h-64"
                          loading="lazy"
                          height={256}
                          width={400}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          )
        ) : null}

        {/* Tags - Show fewer on mobile */}
        {tags && tags.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1.5 sm:gap-2">
            {(isExpanded ? tags : tags.slice(0, 4)).map((tag, idx) => (
              <Badge
                key={idx}
                className="cursor-default bg-gray-100 px-2 py-1 text-[10px] text-gray-700 sm:text-xs"
                variant="secondary"
              >
                #{tag}
              </Badge>
            ))}
            {!isExpanded && tags.length > 4 && (
              <Badge className="bg-gray-100 px-2 py-1 text-[10px] text-gray-600 sm:text-xs">
                +{tags.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="mb-3 flex gap-2 text-xs text-gray-600 sm:flex-row sm:flex-wrap sm:gap-4">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate text-xs">{location}</span>
              </div>
            )}

            {organiserInfo && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate text-xs">{organiserInfo}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions Footer - Mobile optimized */}
        <footer className="flex items-center justify-between border-t border-gray-100 pt-2 sm:pt-3">
          <div className="flex items-center space-x-4 text-gray-500 sm:space-x-6">
            {/* Voting & Comments */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Upvote (toggle) */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onUpvoteClick}
                      aria-label="Upvote"
                      disabled={toggleUpvote.isPending || isLoading}
                      className={`flex place-items-center-safe text-xs transition-colors sm:text-sm ${
                        userUpvoted
                          ? "fill-orange-500 text-orange-600"
                          : "hover:text-orange-600"
                      } ${
                        toggleUpvote.isPending || isLoading
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }`}
                    >
                      <Flame
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          userUpvoted ? "fill-current" : ""
                        }`}
                      />
                      <span>{upvotes > 2 ? `${upvotes} ` : ""}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{userUpvoted ? "Remove upvote" : "Upvote"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Comments (clickable to toggle comment section) */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setShowComments(!showComments)}
                      aria-label="Comments"
                      className="flex items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
                    >
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showComments ? "Hide comments" : "Show comments"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Bookmark */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleBookmark}
                      disabled={isBookmarkLoading}
                      aria-label="Bookmark"
                      className="flex items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
                    >
                      {isBookmarkLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                      ) : (
                        <Bookmark
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            isBookmarked
                              ? "fill-yellow-400 text-yellow-500"
                              : "hover:text-orange-600"
                          }`}
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBookmarked ? "Remove bookmark" : "Bookmark"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Share */}
              <Dialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          aria-label="Share"
                          className="flex items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
                        >
                          <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share opportunity</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share this opportunity</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={shareUrl} />
                    <Button type="button" size="sm" onClick={handleCopy}>
                      Copy
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Twitter/X"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <TwitterXIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Facebook"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <FacebookIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on LinkedIn"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <LinkedInIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on WhatsApp"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <WhatsAppIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`}
                      aria-label="Share via Email"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <EnvelopeIcon className="h-6 w-6" />
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share this opportunity</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={shareUrl} />
                    <Button type="button" size="sm" onClick={handleCopy}>
                      Copy
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Twitter/X"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <TwitterXIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Facebook"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <FacebookIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on LinkedIn"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <LinkedInIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on WhatsApp"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <WhatsAppIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`}
                      aria-label="Share via Email"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <EnvelopeIcon className="h-6 w-6" />
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {needsExpand && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
            >
              {isExpanded ? "Read less" : "Read more"}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </footer>

        {showComments && <CommentSection opportunityId={id} />}
      </div>
    </article>
  );
};

export default OpportunityPost;
