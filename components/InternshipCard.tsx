"use client";

import React, { useState } from "react";
import Image from "next/image";
import { differenceInCalendarDays } from "date-fns";
import { InternshipPostProps } from "@/types/interfaces";
import { Share2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShareDialog } from "./internship/ShareDialog";

const InternshipPost: React.FC<InternshipPostProps> = ({
  internship,
}) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const {
    id,
    title,
    type,
    location,
    poster,
    createdAt,
    hiringOrganization,
    experience,
  } = internship;

  const handleCardClick = () => {
    window.location.href = `/intern/${id}`;
  };

  const formatType = (type: string) => {
    const typeMap: Record<string, string> = {
      "work-from-home": "Remote",
      "hybrid": "Hybrid",
      "in-office": "In-Office",
    };
    return typeMap[type.toLowerCase()] || type;
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

  const handleShareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShareDialogOpen(true);
  };

  return (
    <>
      <div
        className="bg-white rounded-lg border hover:border-gray-300 hover:shadow-md transition-all p-1 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex gap-2">
          {/* Left: Circular Logo */}
          <div className="flex-shrink-0">
            {poster ? (
              <Image
                src={poster}
                alt={hiringOrganization || title}
                width={64}
                height={64}
                className="rounded-full object-cover w-11 h-11 sm:w-13 sm:h-13"
              />
            ) : (
              <div className="w-11 h-11 sm:w-13 sm:h-13 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-base sm:text-lg font-semibold text-gray-500">
                  {hiringOrganization?.charAt(0).toUpperCase() || "I"}
                </span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title, Company and days ago */}
            <div className="flex mb-1">
              <h3 className="text-xs sm:text-sm font-bold text-black flex-1">
                {title} {hiringOrganization && <span className="font-normal">at {hiringOrganization}</span>}
                {createdAt && (
                  <span className="font-normal text-[11px] sm:text-xs text-gray-500 ml-3">
                    {differenceInCalendarDays(new Date(), new Date(createdAt))}d ago
                  </span>
                )}
              </h3>
            </div>

            {/* Bottom Section: Type, Location, Experience and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-sm">
                <span className="text-gray-600 text-[11px] sm:text-sm">
                  {formatType(type)}
                  {location && <span className="text-gray-600"> ({location})</span>}
                  {experience && <span className="text-gray-600 ml-1"> • {experience}</span>}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Share"
                  aria-label="Share"
                  onClick={handleShareClick}
                  className="flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
                >
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <ShareDialog
            shareUrl={shareUrl}
            title={title}
            onCopy={handleCopy}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InternshipPost;
