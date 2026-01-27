"use client";

import React from "react";
import Image from "next/image";
import { differenceInCalendarDays } from "date-fns";
import { InternshipPostProps } from "@/types/interfaces";
import Link from "next/link";
import { Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TwitterXIcon from "@/components/icons/TwitterX";
import FacebookIcon from "@/components/icons/Facebook";
import LinkedInIcon from "@/components/icons/LinkedIn";
import WhatsAppIcon from "@/components/icons/WhatsApp";
import EnvelopeIcon from "@/components/icons/Envelope";

const InternshipPost: React.FC<InternshipPostProps> = ({
  internship,
}) => {
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  const formatType = (type: string) => {
    const typeMap: Record<string, string> = {
      "work-from-home": "Remote",
      "hybrid": "Hybrid",
      "in-office": "In-Office",
    };
    return typeMap[type.toLowerCase()] || type;
  };

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
    <Link href={`/intern/${id}`} className="block">
      <div className="bg-white rounded-lg border hover:border-gray-300 hover:shadow-md transition-all p-1 cursor-pointer">
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
            <h3 className="text-xs sm:text-sm font-bold text-black ">
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
              {/* Share Dialog */}
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShareDialogOpen(true);
                  }}
                  className="p-1.5 rounded-full transition-colors cursor-pointer"
                  aria-label="Share"
                >
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-black hover:text-orange-500"  />
                </button>
                <DialogContent
                  className="sm:max-w-md"
                  onClick={(e) => e.stopPropagation()}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle>Share this internship</DialogTitle>
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
                        `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=internship_card&utm_campaign=internship_share`
                      )}&text=${encodeURIComponent(title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Twitter/X"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TwitterXIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=internship_card&utm_campaign=internship_share`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Facebook"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FacebookIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=internship_card&utm_campaign=internship_share`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on LinkedIn"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LinkedInIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        title +
                        " " +
                        `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=internship_card&utm_campaign=internship_share`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on WhatsApp"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <WhatsAppIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`}
                      aria-label="Share via Email"
                      className="inline-flex items-center justify-center rounded-full border bg-white p-2 hover:bg-neutral-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EnvelopeIcon className="h-6 w-6" />
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
              
            </div>
          </div>
        </div>
      </div>
      </div>
    </Link>
  );
};

export default InternshipPost;
