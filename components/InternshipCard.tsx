"use client";

import React from "react";
import Image from "next/image";
import { format, differenceInCalendarDays } from "date-fns";
import { InternshipPostProps } from "@/types/interfaces";
import Link from "next/link";
import { Briefcase, Clock, MapPin, Share2, IndianRupee, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  const {
    id,
    title,
    type,
    timing,
    location,
    poster,
    createdAt,
    deadline,
    stipend,
    hiringOrganization,
    experience,
    eligibility,
    tags,
  } = internship;

  const formatTypeName = (type?: string): string => {
    if (!type) return "";
    return type
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTimingName = (timing?: string): string => {
    if (!timing) return "";
    return timing
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getDaysLeft = (deadline?: string): number | null => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const days = differenceInCalendarDays(deadlineDate, today);
    return days >= 0 ? days : null;
  };

  const daysLeft = getDaysLeft(deadline);
  const displayedTags = tags?.slice(0, 3) || [];
  const remainingTags = tags && tags.length > 3 ? tags.length - 3 : 0;
  const displayedEligibility = eligibility?.slice(0, 3) || [];
  const remainingEligibility = eligibility && eligibility.length > 3 ? eligibility.length - 3 : 0;
  
  // Mobile: show 1 tag + remaining, Desktop: show 3 tags + remaining
  const mobileDisplayedTags = tags?.slice(0, 1) || [];
  const mobileRemainingTags = tags && tags.length > 1 ? tags.length - 1 : 0;
  const mobileDisplayedEligibility = eligibility?.slice(0, 1) || [];
  const mobileRemainingEligibility = eligibility && eligibility.length > 1 ? eligibility.length - 1 : 0;

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
      <div className="bg-white rounded-lg border hover:border-gray-300 hover:shadow-md transition-all p-5 cursor-pointer">
        <div className="flex gap-4">
        {/* Left: Circular Logo */}
        <div className="flex-shrink-0">
          {poster ? (
            <Image
              src={poster}
              alt={hiringOrganization || title}
              width={64}
              height={64}
              className="rounded-full object-cover w-12 h-12 sm:w-16 sm:h-16"
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-base sm:text-lg font-semibold text-gray-500">
                {hiringOrganization?.charAt(0).toUpperCase() || "I"}
              </span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title, Company and Location */}
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-md font-bold text-black mb-1 line-clamp-2 sm:line-clamp-1 sm:text-lg">{title}</h3>
              <p className="text-sm text-black line-clamp-1">{hiringOrganization}</p>
            </div>
            {location && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-black px-2 py-1 rounded-md flex-shrink-0">
                <MapPin className="w-4 h-4 text-black" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
          </div>

          {/* Key Details with Icons */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-black">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-black" />
              <span className="line-clamp-1">{experience || "No prior experience required"}</span>
            </div>
            {timing && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-black" />
                <span>{formatTimingName(timing)}</span>
              </div>
            )}
            {type && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-black" />
                <span>{formatTypeName(type)}</span>
              </div>
            )}
            {location && (
              <div className="flex sm:hidden items-center gap-1.5">
                <MapPin className="w-4 h-4 text-black" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
          </div>

          {/* Skills/Tags Badges */}
          {displayedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Mobile: Show 1 tag + remaining */}
              {mobileDisplayedTags.map((tag, idx) => (
                <Badge
                  key={`mobile-${idx}`}
                  variant="outline"
                  className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-normal px-2 py-0.5 sm:hidden"
                >
                  {tag}
                </Badge>
              ))}
              {mobileRemainingTags > 0 && (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-normal px-2 py-0.5 sm:hidden"
                >
                  +{mobileRemainingTags}
                </Badge>
              )}
              {/* Desktop: Show 3 tags + remaining */}
              {displayedTags.map((tag, idx) => (
                <Badge
                  key={`desktop-${idx}`}
                  variant="outline"
                  className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-normal px-2 py-0.5 hidden sm:inline-flex"
                >
                  {tag}
                </Badge>
              ))}
              {remainingTags > 0 && (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-normal px-2 py-0.5 hidden sm:inline-flex"
                >
                  +{remainingTags}
                </Badge>
              )}
            </div>
          )}

          {/* Eligibility Badges */}
          {displayedEligibility.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Mobile: Show 1 eligibility + remaining */}
              {mobileDisplayedEligibility.map((item, idx) => (
                <Badge
                  key={`mobile-elig-${idx}`}
                  variant="outline"
                  className="bg-gray-100 text-gray-900 border-gray-300 text-xs font-normal px-2 py-0.5 sm:hidden"
                >
                  {item}
                </Badge>
              ))}
              {mobileRemainingEligibility > 0 && (
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-900 border-gray-300 text-xs font-normal px-2 py-0.5 sm:hidden"
                >
                  +{mobileRemainingEligibility}
                </Badge>
              )}
              {/* Desktop: Show 3 eligibility + remaining */}
              {displayedEligibility.map((item, idx) => (
                <Badge
                  key={`desktop-elig-${idx}`}
                  variant="outline"
                  className="bg-gray-100 text-gray-900 border-gray-300 text-xs font-normal px-2 py-0.5 hidden sm:inline-flex"
                >
                  {item}
                </Badge>
              ))}
              {remainingEligibility > 0 && (
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-900 border-gray-300 text-xs font-normal px-2 py-0.5 hidden sm:inline-flex"
                >
                  +{remainingEligibility}
                </Badge>
              )}
            </div>
          )}

          {/* Days Left Badge - Mobile Only */}
          <div className="flex items-center gap-2 mb-3 sm:hidden">
            {daysLeft !== null ? (
              <Badge className="bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 px-2 py-0.5">
                {daysLeft} days left
              </Badge>
            ) : (
              <Badge className="bg-red-200 text-red-800 border-red-300 px-2 py-0.5">
                Closed
              </Badge>
            )}
          </div>

          {/* Bottom Section: Posted Date, Days Left, Stipend, Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-orange-400">
            <div className="flex items-center gap-4 text-sm">
              {createdAt && (
                <span className="text-blue-900 hidden sm:block">
                  Posted {format(new Date(createdAt), "MMM d, yyyy")}
                </span>
              )}
              {daysLeft !== null ? (
                <Badge className="bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 px-2 py-0.5 hidden sm:inline-flex">
                  {daysLeft} days left
                </Badge>
              ) : (
                <Badge className="bg-red-200 text-red-800 border-red-300 px-2 py-0.5 hidden sm:inline-flex">
                  Closed
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Stipend */}
              <Badge className={`${stipend && stipend > 0 ? "bg-green-100 text-green-900 border-green-300" : "bg-gray-100 text-gray-900 border-gray-300"} px-3 py-1`}>
                <div className="flex items-center gap-1">
                  {stipend && stipend > 0 ? (
                    <>
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span className="font-medium">
                        {stipend >= 1000 ? `${(stipend / 1000).toFixed(0)} K` : stipend}/Month
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">Unpaid</span>
                  )}
                </div>
              </Badge>

              {/* Share Dialog */}
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShareDialogOpen(true);
                  }}
                  className="p-1.5 hover:bg-orange-200/70 rounded-full transition-colors cursor-pointer"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4 text-black"  />
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
