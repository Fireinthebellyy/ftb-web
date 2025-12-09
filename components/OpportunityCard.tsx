"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Bookmark,
  MessageSquare,
  Building2,
  Loader2,
  Share2,
  EllipsisVertical,
  Trash2,
  PencilLine,
  Heart,
  BadgeCheck,
} from "lucide-react";
import TwitterXIcon from "@/components/icons/TwitterX";
import FacebookIcon from "@/components/icons/Facebook";
import LinkedInIcon from "@/components/icons/LinkedIn";
import WhatsAppIcon from "@/components/icons/WhatsApp";
import EnvelopeIcon from "@/components/icons/Envelope";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  Autoplay,
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
import NewOpportunityForm from "@/components/opportunity/NewOpportunityForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const OpportunityPost: React.FC<OpportunityPostProps> = ({
  opportunity,
  onBookmarkChange,
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
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const _handleEditSuccess = () => {
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  };

  const _handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDeletePost = async () => {
    try {
      const res = await axios.delete(`/api/opportunities/${id}`);
      if (res.status === 200 || res.status === 204) {
        toast.success("Post deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const showUpvoteCount = false;
  const isExpanded = true;

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalIndex, setModalIndex] = useState<number>(0);

  const modalFileId = images[modalIndex] ?? images[0] ?? null;

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

  return (
    <article className="relative mb-3 w-full rounded-lg border bg-white shadow-sm sm:mb-4">
      {isExpanded && images.length > 0 ? (
        images.length === 1 ? (
          <div className="overflow-hidden">
            <div
              className="cursor-pointer"
              onClick={() => {
                setModalIndex(0);
                setModalOpen(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setModalIndex(0);
                  setModalOpen(true);
                }
              }}
            >
              {images[0] ? (
                <Image
                  src={opportunityStorage.getFileView(
                    process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
                    images[0]
                  )}
                  alt={title}
                  className="max-h-48 w-full rounded-t-lg object-cover sm:max-h-64"
                  loading="lazy"
                  height={256}
                  width={400}
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-neutral-100 text-sm text-gray-400">
                  Image not available
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <Carousel
              className="w-full"
              plugins={[
                Autoplay({
                  delay: 3000,
                }),
              ]}
            >
              <CarouselContent>
                {images.map((image, i) => (
                  <CarouselItem key={i}>
                    <div
                      className="cursor-pointer overflow-hidden"
                      onClick={() => {
                        setModalIndex(i);
                        setModalOpen(true);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setModalIndex(i);
                          setModalOpen(true);
                        }
                      }}
                    >
                      {image ? (
                        <Image
                          src={opportunityStorage.getFileView(
                            process.env
                              .NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
                            image
                          )}
                          alt={`${title} - Image ${i + 1}`}
                          className="max-h-48 w-full rounded-t-lg object-cover sm:max-h-64"
                          loading="lazy"
                          height={256}
                          width={400}
                        />
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-neutral-100 text-sm text-gray-400">
                          Image not available
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselDots />
            </Carousel>
          </div>
        )
      ) : null}

      <div className="absolute -top-0.5 right-0 z-10">
        <Badge
          className={`${getTypeColor(
            primaryType
          )} px-2 py-1 text-xs text-[10px] font-medium sm:text-xs rounded-tl-none rounded-br-none`}
        >
          {primaryType?.charAt(0).toUpperCase() + primaryType?.slice(1)}
        </Badge>
      </div>

      <div className="px-3 py-2 sm:px-4">

        <h2 className="mb-2 line-clamp-1 truncate text-base leading-tight font-bold text-gray-900 sm:text-lg">
          {title}
        </h2>

        {/* Tags - Show fewer on mobile */}
        {tags && tags.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1.5 sm:gap-2">
            {(isExpanded ? tags : tags.slice(0, 4)).map((tag, idx) => (
              <Badge
                key={idx}
                className="cursor-default bg-neutral-200 px-2 py-1 text-[10px] text-gray-700 sm:text-xs"
                variant="secondary"
              >
                #{tag}
              </Badge>
            ))}
            {!isExpanded && tags.length > 4 && (
              <Badge className="bg-neutral-200 px-2 py-1 text-[10px] text-gray-600 sm:text-xs">
                +{tags.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {description && (
          <div
            className={`text-sm leading-relaxed text-gray-700 ${!isExpanded ? "mb-2 line-clamp-1 overflow-hidden" : "mb-3"
              }`}
          >
            <p className="line-clamp-4 text-ellipsis">
              {typeof description === "string"
                ? description
                  .split(/(https?:\/\/[^\s<>"'`|\\^{}\[\]]+)/gi)
                  .map((part, index) => {
                    if (part.match(/^https?:\/\/[^\s<>"'`|\\^{}\[\]]+$/i)) {
                      return (
                        <Link
                          href={`${part}?utm_source=ftb_web&utm_medium=opportunity_card`}
                          target="_blank"
                          rel="noopener noreferrer"
                          key={index}
                          className="text-blue-400"
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

        <div className="flex">
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
        </div>

        <header className="flex items-end sm:items-center space-x-2 pb-2 sm:pb-3">
          <div className="flex-shrink-0">
            {user &&
              user.image &&
              !user.image.includes("https://media.licdn.com") ? (
              <div className="size-4 overflow-hidden rounded-full border border-gray-100 shadow sm:size-7">
                <Image
                  src={user.image}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                  width={30}
                  height={30}
                />
              </div>
            ) : (
              <div className="flex size-4 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-gray-600 uppercase sm:size-7">
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
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user && user.name ? user.name : "Opportunity Organizer"}
              </p>
              {user?.role === "member" && (
                <span title="Verified Member">
                  <BadgeCheck className="size-4 text-orange-600 stroke-3" />
                </span>
              )}
            </div>

          </div>
          <p className="text-xs text-gray-400">
            {createdAt ? formatDate(createdAt) : ""}
          </p>


        </header>

        {/* Image lightbox modal */}
        <Dialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
          <DialogContent
            className="mx-auto min-w-auto p-0 md:min-w-3xl"
            overlayClassName="bg-black/70"
          >
            <DialogHeader className="hidden">
              <DialogTitle className="text-lg font-semibold text-gray-600"></DialogTitle>
            </DialogHeader>

            {images.length <= 1 ? (
              <div className="flex items-center justify-center">
                {modalFileId ? (
                  <Image
                    src={opportunityStorage.getFileView(
                      process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
                      modalFileId
                    )}
                    alt={title}
                    className="max-h-[80vh] w-full object-contain"
                    height={600}
                    width={800}
                  />
                ) : (
                  <div className="w-full text-center text-sm text-gray-400">
                    Image not available
                  </div>
                )}
              </div>
            ) : (
              <Carousel
                className="w-full"
                setApi={(api) => {
                  // Ensure Embla scrolls to the selected index after initialization
                  setTimeout(() => api?.scrollTo(modalIndex), 0);
                }}
              >
                <CarouselContent>
                  {images.map((image, idx) => (
                    <CarouselItem key={idx}>
                      <div className="flex h-full items-center justify-center bg-transparent">
                        {image ? (
                          <Image
                            src={opportunityStorage.getFileView(
                              process.env
                                .NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
                              image
                            )}
                            alt={`${title} - Image ${idx + 1}`}
                            className="max-h-[80vh] w-full object-contain"
                            height={600}
                            width={800}
                          />
                        ) : (
                          <div className="w-full text-center text-sm text-gray-400">
                            Image not available
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselDots />
              </Carousel>
            )}
          </DialogContent>
        </Dialog>



        {/* Actions Footer - Mobile optimized */}
        <footer className="flex items-center justify-between border-t border-gray-100 pt-1">
          <div className="flex h-9 items-center space-x-4 text-gray-500 sm:space-x-6">
            {/* Voting & Comments */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Upvote (toggle) */}
              <button
                onClick={onUpvoteClick}
                title="Upvote"
                aria-label="Upvote"
                disabled={toggleUpvote.isPending || isLoading}
                className={`flex cursor-pointer place-items-center text-xs transition-colors sm:text-sm ${userUpvoted
                  ? "fill-orange-500 text-orange-600"
                  : "hover:text-orange-600"
                  } ${toggleUpvote.isPending || isLoading
                    ? "cursor-not-allowed opacity-60"
                    : ""
                  }`}
              >
                <Heart
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${userUpvoted ? "fill-current" : ""
                    }`}
                />
                {showUpvoteCount && (
                  <span className="pl-1">
                    {upvotes > 2 ? `${upvotes} ` : ""}
                  </span>
                )}
              </button>
              {/* Comments (clickable to toggle comment section) */}
              <button
                type="button"
                title="Comments"
                onClick={() => setShowComments(!showComments)}
                aria-label="Comments"
                className="flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              {/* Bookmark */}
              <button
                type="button"
                title="Bookmark"
                onClick={handleBookmark}
                disabled={isBookmarkLoading}
                aria-label="Bookmark"
                className="flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
              >
                {isBookmarkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                ) : (
                  <Bookmark
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${isBookmarked
                      ? "fill-yellow-400 text-yellow-500"
                      : "hover:text-orange-600"
                      }`}
                  />
                )}
              </button>
              {/* Share */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    title="Share"
                    aria-label="Share"
                    className="flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
                  >
                    <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </DialogTrigger>
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
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=opportunity_card&utm_campaign=opportunity_share`
                      )}&text=${encodeURIComponent(title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Twitter/X"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <TwitterXIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=opportunity_card&utm_campaign=opportunity_share`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Facebook"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <FacebookIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=opportunity_card&utm_campaign=opportunity_share`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on LinkedIn"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                    >
                      <LinkedInIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        title +
                        " " +
                        `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=opportunity_card&utm_campaign=opportunity_share`
                      )}`}
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
          {session?.user?.id === user?.id && (
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <EllipsisVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-42">
                  <>
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <PencilLine />
                      <p className="text-muted-foreground text-sm">Edit Post</p>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onClick={() => {
                        if (
                          confirm("Are you sure you want to delete this post?")
                        ) {
                          handleDeletePost();
                        }
                      }}
                    >
                      <Trash2 />
                      <p className="text-muted-foreground text-sm">
                        Delete Post
                      </p>
                    </DropdownMenuItem>
                  </>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </footer>

        {/* Edit dialog */}
        <Dialog open={isEditing} onOpenChange={(open) => setIsEditing(open)}>
          <DialogContent
            className="mx-auto p-4 md:max-h-[600px] md:min-w-[600px]"
            overlayClassName="backdrop-blur-xs bg-black/30"
          >
            <NewOpportunityForm
              opportunity={opportunity}
              onOpportunityCreated={_handleEditSuccess}
              onCancel={_handleEditCancel}
            />
          </DialogContent>
        </Dialog>

        {showComments && <CommentSection opportunityId={id} />}
      </div>
    </article>
  );
};

export default OpportunityPost;
