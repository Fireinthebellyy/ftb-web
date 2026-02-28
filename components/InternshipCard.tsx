"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { InternshipPostProps } from "@/types/interfaces";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { ShareDialog } from "./internship/ShareDialog";

const InternshipPost: React.FC<InternshipPostProps> = ({ internship }) => {
  const router = useRouter();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const {
    id,
    title,
    type,
    location,
    createdAt,
    hiringOrganization,
    experience,
  } = internship;

  const handleCardClick = () => {
    router.push(`/intern/${id}`);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const formatType = (type: string) => {
    const typeMap: Record<string, string> = {
      remote: "Remote",
      hybrid: "Hybrid",
      onsite: "Onsite",
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
        role="button"
        tabIndex={0}
        className="cursor-pointer rounded-lg border bg-white px-3 py-2.5 transition-all hover:border-gray-300 hover:shadow-md sm:px-4 sm:py-3"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        {/* Main Content */}
        <div className="min-w-0">
          {/* Title, Company and days ago */}
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-sm leading-snug font-semibold text-slate-900 sm:text-base">
              {title}{" "}
              {hiringOrganization && (
                <span className="font-normal text-slate-700">
                  at {hiringOrganization}
                </span>
              )}
            </h3>
            {createdAt && (
              <span className="shrink-0 pt-0.5 text-[11px] text-gray-500 sm:text-xs">
                {formatDate(createdAt)}
              </span>
            )}
          </div>

          {/* Bottom Section: Type, Location, Experience and Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 text-xs text-gray-600 sm:text-sm">
              <span className="truncate text-xs text-gray-600 sm:text-sm">
                {type ? formatType(type) : "Internship"}
                {location && (
                  <span className="text-gray-600"> ({location})</span>
                )}
                {experience && (
                  <span className="ml-1 text-gray-600"> • {experience}</span>
                )}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                title="Share"
                aria-label="Share"
                onClick={handleShareClick}
                className="flex cursor-pointer items-center rounded-md p-1 text-xs transition-colors hover:bg-orange-50 hover:text-orange-600 sm:text-sm"
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <ShareDialog shareUrl={shareUrl} title={title} onCopy={handleCopy} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InternshipPost;
