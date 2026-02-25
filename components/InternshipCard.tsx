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
        className="cursor-pointer rounded-lg border bg-white p-2 transition-all hover:border-gray-300 hover:shadow-md"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        {/* Main Content */}
        <div className="min-w-0">
          {/* Title, Company and days ago */}
          <div className="mb-1 flex">
            <h3 className="flex-1 text-xs font-bold text-black sm:text-sm">
              {title}{" "}
              {hiringOrganization && (
                <span className="font-normal">at {hiringOrganization}</span>
              )}
              {createdAt && (
                <span className="ml-3 text-[11px] font-normal text-gray-500 sm:text-xs">
                  {formatDate(createdAt)}
                </span>
              )}
            </h3>
          </div>

          {/* Bottom Section: Type, Location, Experience and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] sm:gap-4 sm:text-sm">
              <span className="text-[11px] text-gray-600 sm:text-sm">
                {type ? formatType(type) : "Internship"}
                {location && (
                  <span className="text-gray-600"> ({location})</span>
                )}
                {experience && (
                  <span className="ml-1 text-gray-600"> • {experience}</span>
                )}
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

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <ShareDialog shareUrl={shareUrl} title={title} onCopy={handleCopy} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InternshipPost;
