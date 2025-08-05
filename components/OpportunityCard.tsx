"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Bookmark,
  ChevronUp,
  MessageSquare,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { createOpportunityStorage } from "@/lib/appwrite";
import Image from "next/image";
import { OpportunityPostProps } from "@/types/interfaces";
import { useOpportunity, useToggleUpvote } from "@/lib/queries";
import Link from "next/link";
import axios from "axios";

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
  const [showMessage, setShowMessage] = useState<boolean>(false);

  // Upvote state via React Query
  const { data, isLoading } = useOpportunity(id);
  const toggleUpvote = useToggleUpvote(id);

  // Placeholder for comments count (UI only for now)

  const handleBookmark = (): void => {
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);

    if (onBookmarkChange) {
      onBookmarkChange(id, newBookmarkState);
    }

    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);
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
    <article className="w-full bg-white border rounded-lg shadow-sm mb-3 sm:mb-4">
      {/* Post Header */}
      <header className="flex items-center p-3 sm:p-4 space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user &&
          user.image &&
          !user.image.includes("https://media.licdn.com") ? (
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
              <AvatarImage
                src={user.image}
                alt={user.name}
                className="object-cover w-full h-full"
              />
            </Avatar>
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold uppercase text-sm">
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

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user && user.name ? user.name : "Opportunity Organizer"}
          </p>
          <p className="text-xs text-gray-500">
            {createdAt ? `${format(new Date(createdAt), "MMM dd")}` : ""}
          </p>
        </div>

        {/* Type Badge - Smaller on mobile */}
        <Badge
          className={`${getTypeColor(
            primaryType
          )} font-medium text-xs px-2 py-1 text-[10px] sm:text-xs`}
        >
          {primaryType?.charAt(0).toUpperCase() + primaryType?.slice(1)}
        </Badge>
      </header>

      {/* Post Content */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-tight">
          {title}
        </h2>

        {/* Description */}
        <div className="text-gray-700 text-sm leading-relaxed mb-3">
          <p>
            {description && typeof description === "string"
              ? description
                  .split(/(https?:\/\/[^\s<>"'`|\\^{}\[\]]+)/gi)
                  .map((part, index) => {
                    if (part.match(/^https?:\/\/[^\s<>"'`|\\^{}\[\]]+$/i)) {
                      return (
                        <span key={index} className="text-gray-400">
                          {part}
                        </span>
                      );
                    }
                    return part;
                  })
              : description}
          </p>

          {meta && (
            <Link href={meta?.url} target="_blank" rel="noopener noreferrer">
              <div className="border border-gray-300 shadow-sm rounded p-2 mt-1 flex flex-col">
                {meta.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meta.image}
                    alt={meta.title}
                    className="w-full h-auto rounded"
                  />
                )}
                <h3 className="font-semibold text-sm mt-2">{meta.title}</h3>
                <p className="text-sm text-gray-600">{meta.description}</p>
              </div>
            </Link>
          )}
        </div>

        {/* Image (optional) */}
        {images.length > 0 && !meta?.image
          ? images.map((image, i) => (
              <div className="mb-3 rounded overflow-hidden" key={i}>
                <Image
                  src={opportunityStorage.getFileView(
                    process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
                    image
                  )}
                  alt={title}
                  className="w-full object-contain max-h-48 sm:max-h-64"
                  loading="lazy"
                  height={256}
                  width={400}
                />
              </div>
            ))
          : null}

        {/* Tags - Show fewer on mobile */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            {tags
              .slice(
                0,
                typeof window !== "undefined" && window.innerWidth < 640 ? 2 : 4
              )
              .map((tag, idx) => (
                <Badge
                  key={idx}
                  className="text-[10px] sm:text-xs bg-gray-100 text-gray-700 px-2 py-1 cursor-default"
                  variant="secondary"
                >
                  #{tag}
                </Badge>
              ))}
            {tags.length >
              (typeof window !== "undefined" && window.innerWidth < 640
                ? 2
                : 4) && (
              <Badge className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-1">
                +
                {tags.length -
                  (typeof window !== "undefined" && window.innerWidth < 640
                    ? 2
                    : 4)}{" "}
                more
              </Badge>
            )}
          </div>
        )}

        {/* Dates, Location info - Stack on mobile */}
        <div className="flex sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-gray-600 text-xs mb-3">
          {(startDate || endDate) && (
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs">
                {startDate && format(new Date(startDate), "MMM dd")}
                {startDate && endDate && " - "}
                {endDate && format(new Date(endDate), "MMM dd")}
              </span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate text-xs">{location}</span>
            </div>
          )}

          {organiserInfo && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate text-xs">{organiserInfo}</span>
            </div>
          )}
        </div>

        {/* Actions Footer - Mobile optimized */}
        <footer className="flex items-center justify-between border-t border-gray-100 pt-2 sm:pt-3">
          <div className="flex items-center space-x-4 sm:space-x-6 text-gray-500">
            {/* Voting & Comments */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Upvote (toggle) */}
              <button
                onClick={onUpvoteClick}
                aria-label="Upvote"
                disabled={toggleUpvote.isPending || isLoading}
                className={`flex items-center gap-1 transition-colors text-xs sm:text-sm ${
                  userUpvoted ? "text-green-600" : "hover:text-green-600"
                } ${
                  toggleUpvote.isPending || isLoading
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                <ChevronUp
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    userUpvoted ? "fill-current" : ""
                  }`}
                />
                <span className="min-w-[1ch] tabular-nums">{upvotes}</span>
              </button>

              {/* Comments (placeholder increments) */}
              <button
                type="button"
                aria-label="Comments"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors text-xs sm:text-sm"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="min-w-[1ch] tabular-nums">{0}</span>
              </button>
            </div>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              aria-label="Bookmark"
              className="flex items-center gap-1 hover:text-yellow-500 transition-colors text-xs sm:text-sm"
            >
              <Bookmark
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isBookmarked ? "text-yellow-500" : "text-gray-400"
                }`}
              />
            </button>
          </div>
        </footer>

        {/* Bookmark Message - Mobile positioned */}
        {showMessage && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 sm:bottom-8 sm:right-8 sm:left-auto sm:transform-none bg-gray-800 text-white px-3 py-2 sm:px-4 rounded shadow-lg text-xs sm:text-sm z-50">
            {isBookmarked ? "Added to bookmarks" : "Removed from bookmarks"}
          </div>
        )}
      </div>
    </article>
  );
};

export default OpportunityPost;
