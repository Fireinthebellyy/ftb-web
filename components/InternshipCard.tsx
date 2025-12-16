"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Bookmark,
  Building2,
  Loader2,
  BadgeCheck,
  ExternalLink,
  IndianRupee,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { InternshipPostProps } from "@/types/interfaces";
import { useInternship, useToggleUpvote, useIsBookmarked } from "@/lib/queries";
import Link from "next/link";
import axios from "axios";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const InternshipPost: React.FC<InternshipPostProps> = ({
  internship,
  onBookmarkChange,
}) => {
  const {
    id,
    type,
    tags,
    title,
    description,
    poster,
    link,
    location,
    deadline,
    stipend,
    hiringOrganization,
    hiringManager,
    createdAt,
    user,
  } = internship;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const _handleEditSuccess = () => {
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ["internships"] });
  };

  const _handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDeletePost = async () => {
    try {
      const res = await axios.delete(`/api/internships/${id}`);
      if (res.status === 200 || res.status === 204) {
        toast.success("Post deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ["internships"] });
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

  const { data: session } = authClient.useSession();
  const { data, isLoading } = useInternship(id);
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
      toast.error("Please log in to bookmark internships");
      return;
    }

    if (!isValidUUID(id)) {
      console.error("Invalid internship ID format");
      return;
    }

    const currentUserId = session.user.id as string;
    const newBookmarkState = !isBookmarked;

    setIsBookmarkLoading(true);

    try {
      if (newBookmarkState) {
        const response = await axios.post("/api/bookmarks", {
          userId: currentUserId,
          opportunityId: id, // Note: reusing bookmarks table, but this might need separate table
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

  const getTypeColor = (type?: string): string => {
    const colors: Record<string, string> = {
      "part-time": "bg-blue-100 text-blue-800",
      "full-time": "bg-green-100 text-green-800",
      contract: "bg-purple-100 text-purple-800",
      remote: "bg-orange-100 text-orange-800",
    };
    return colors[type?.toLowerCase() || "part-time"] || colors["part-time"];
  };

  const upvotes = data?.upvotes ?? (internship as any)?.upvoteCount ?? 0;
  const userUpvoted =
    data?.hasUserUpvoted ??
    ((internship as any)?.userHasUpvoted as boolean | undefined) ??
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
    ? `${publicBaseUrl}/intern/${id}`
    : `/intern/${id}`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <article className="relative mb-3 w-full rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md sm:mb-4">
      {/* Type Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge
          className={`${getTypeColor(
            type
          )} px-3 py-1 text-xs font-medium shadow-sm`}
        >
          {type?.charAt(0).toUpperCase() + type?.slice(1).replace("-", " ")}
        </Badge>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col md:flex-row">
        {/* Poster Image */}
        {poster && (
          <div className="overflow-hidden md:w-2/5 lg:w-1/3">
            <div
              className="h-full cursor-pointer"
              onClick={() => setModalOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setModalOpen(true);
                }
              }}
            >
              <Image
                src={poster}
                alt={title}
                className="h-full min-h-[200px] w-full rounded-t-lg object-cover transition-transform hover:scale-105 md:rounded-l-lg md:rounded-tr-none"
                loading="lazy"
                height={300}
                width={400}
              />
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className={`flex-1 p-4 sm:p-5 ${poster ? "md:pl-6" : ""}`}>
          {/* Title */}
          <h2 className="mb-3 line-clamp-2 pr-24 text-lg leading-tight font-bold text-gray-900 sm:text-xl md:pr-20">
            {title}
          </h2>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(isExpanded ? tags : tags.slice(0, 5)).map((tag, idx) => (
                <Badge
                  key={idx}
                  className="cursor-default border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-normal text-blue-700 hover:bg-blue-100"
                  variant="secondary"
                >
                  #{tag}
                </Badge>
              ))}
              {!isExpanded && tags.length > 5 && (
                <Badge className="border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600">
                  +{tags.length - 5} more
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="mb-4 text-sm leading-relaxed text-gray-700">
              <p className="line-clamp-3">
                {typeof description === "string"
                  ? description
                      .split(/(https?:\/\/[^\s<>"'`|\\^{}\[\]]+)/gi)
                      .map((part, index) => {
                        if (part.match(/^https?:\/\/[^\s<>"'`|\\^{}\[\]]+$/i)) {
                          return (
                            <Link
                              href={`${part}?utm_source=ftb_web&utm_medium=internship_card&utm_campaign=internship_share`}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={index}
                              className="text-blue-500 underline hover:text-blue-700"
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

          {/* Internship Details Grid */}
          <div className="mb-4 grid grid-cols-1 gap-2.5 text-sm text-gray-700 sm:grid-cols-2">
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span className="truncate font-medium">{location}</span>
              </div>
            )}

            {hiringOrganization && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span className="truncate font-medium">
                  {hiringOrganization}
                </span>
              </div>
            )}

            {stipend && (
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span className="font-medium">
                  ₹{stipend.toLocaleString("en-IN")}/month
                </span>
              </div>
            )}

            {deadline && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span className="font-medium">
                  Due: {format(new Date(deadline), "MMM dd, yyyy")}
                </span>
              </div>
            )}
          </div>

          {/* Hiring Manager */}
          {hiringManager && (
            <div className="mb-4 flex items-start gap-2 text-sm">
              <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <div>
                <span className="text-gray-600">Contact:</span>{" "}
                <span className="font-medium text-gray-900">
                  {hiringManager}
                </span>
              </div>
            </div>
          )}

          {/* Apply Button */}
          {link && (
            <div className="flex gap-2">
              <Link
                href={`${link}?utm_source=ftb_web&utm_medium=internship_card&utm_campaign=internship_apply`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-blue-600 font-medium text-white shadow-sm hover:bg-blue-700">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply Now
                </Button>
              </Link>
              <Button
                onClick={handleBookmark}
                disabled={isBookmarkLoading}
                variant="outline"
                size="icon"
                className={`flex-shrink-0 ${
                  isBookmarked
                    ? "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "hover:bg-gray-50"
                }`}
              >
                {isBookmarkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bookmark
                    className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`}
                  />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image lightbox modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
        <DialogContent
          className="mx-auto min-w-auto p-0 md:min-w-3xl"
          overlayClassName="bg-black/70"
        >
          <DialogHeader className="hidden">
            <DialogTitle className="text-lg font-semibold text-gray-600"></DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {poster ? (
              <Image
                src={poster}
                alt={title}
                className="max-h-[80vh] w-full object-contain"
                height={600}
                width={800}
              />
            ) : (
              <div className="w-full text-center text-sm text-gray-400">
                No image available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
};

export default InternshipPost;
