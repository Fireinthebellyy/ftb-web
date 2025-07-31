"use client";

import React, { useState } from "react";
import { CalendarDays, MapPin, ExternalLink, Bookmark } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: string | string[];
  tags?: string[];
  url?: string;
  image?: string;
  created_at?: string;
  location?: string;
  organiser_info?: string;
  start_date?: string;
  end_date?: string;
};

interface OpportunityPostProps {
  opportunity: Opportunity;
  onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
}

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
    url,
    image,
    created_at,
    location,
    organiser_info,
    start_date,
    end_date,
  } = opportunity;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showMessage, setShowMessage] = useState<boolean>(false);

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

  return (
    <article className="w-full bg-white border rounded-lg shadow-sm mb-3 sm:mb-4">
      {/* Post Header */}
      <header className="flex items-center p-3 sm:p-4 space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold uppercase text-sm">
            {organiser_info
              ? organiser_info
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
              : "OP"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {organiser_info || "Opportunity Organizer"}
          </p>
          <p className="text-xs text-gray-500">
            {created_at ? `${format(new Date(created_at), "MMM dd")}` : ""}
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

        {/* Image (optional) */}
        {image && (
          <div className="mb-3 rounded overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full object-cover max-h-48 sm:max-h-64"
              loading="lazy"
            />
          </div>
        )}

        {/* Description */}
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          {description}
        </p>

        {/* Tags - Show fewer on mobile */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            {tags.slice(0, window.innerWidth < 640 ? 2 : 4).map((tag, idx) => (
              <Badge
                key={idx}
                className="text-[10px] sm:text-xs bg-gray-100 text-gray-700 px-2 py-1 cursor-default"
                variant="secondary"
              >
                #{tag}
              </Badge>
            ))}
            {tags.length > (window.innerWidth < 640 ? 2 : 4) && (
              <Badge className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-1">
                +{tags.length - (window.innerWidth < 640 ? 2 : 4)} more
              </Badge>
            )}
          </div>
        )}

        {/* Dates, Location info - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-gray-600 text-xs mb-3">
          {(start_date || end_date) && (
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs">
                {start_date && format(new Date(start_date), "MMM dd")}
                {start_date && end_date && " - "}
                {end_date && format(new Date(end_date), "MMM dd")}
              </span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate text-xs">{location}</span>
            </div>
          )}
        </div>

        {/* Actions Footer - Mobile optimized */}
        <footer className="flex items-center justify-between border-t border-gray-100 pt-2 sm:pt-3">
          <div className="flex items-center space-x-4 sm:space-x-6 text-gray-500">
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
              <span className="hidden sm:inline">
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </span>
            </button>

            {/* External Link */}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors text-xs sm:text-sm"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Visit</span>
              </a>
            )}
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
