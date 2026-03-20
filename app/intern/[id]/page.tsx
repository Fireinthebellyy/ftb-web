"use client";

import React, { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, ArrowLeft, Share2, Flag, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import posthog from "posthog-js";
import { toTitleCase } from "@/lib/utils";
import { ShareDialog } from "@/components/internship/ShareDialog";
import { useSession } from "@/hooks/use-session";
import { type InternshipData } from "@/types/interfaces";
import { mapInternshipToApplyOpportunity } from "@/lib/internship-utils";
import ApplyModal from "@/components/tracker/ApplyModal";
import { useTracker } from "@/components/providers/TrackerProvider";

import { InternshipHero } from "@/components/internship/InternshipHero";
import { InternshipTabContent } from "@/components/internship/InternshipTabContent";
import { InternshipDesktopHeader } from "@/components/internship/InternshipDesktopHeader";
import { InternshipDesktopSidebar } from "@/components/internship/InternshipDesktopSidebar";
import { InternshipStickyFooter } from "@/components/internship/InternshipStickyFooter";

export default function InternshipDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<InternshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [smartApplyOpen, setSmartApplyOpen] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const { data: session } = useSession();
  const { addToTracker, getStatus, removeFromTracker } = useTracker();

  const isBookmarked = !!getStatus(id || "", "internship");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/internships/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setNotFoundError(true);
          setLoading(false);
          return;
        }

        setInternship(data.internship as InternshipData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching internship:", error);
        setNotFoundError(true);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (notFoundError) notFound();

  const publicBaseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = publicBaseUrl
    ? `${publicBaseUrl}/intern/${id}`
    : `/intern/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      posthog.capture("internship_shared", {
        internship_id: id,
        title: internship?.title,
        method: "copy",
      });
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (method: string) => {
    posthog.capture("internship_shared", {
      internship_id: id,
      title: internship?.title,
      method,
    });
  };

  const handleBookmarkClick = async () => {
    if (!id || !internship) return;
    try {
      if (isBookmarked) {
        await removeFromTracker(id, "internship");
      } else {
        await addToTracker(id, "Not Applied", "internship");
      }
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleCalendarClick = () => {
    if (!internship) return;
    const date = internship.deadline
      ? new Date(internship.deadline)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const formatted = date.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const dateEnd = new Date(date.getTime() + 30 * 60 * 1000);
    const formattedEnd = dateEnd.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Apply to: ${internship.title}`)}&dates=${formatted}/${formattedEnd}&details=${encodeURIComponent(`Company: ${internship.hiringOrganization || "N/A"}\n\nInternship Link: ${shareUrl}`)}`;
    window.open(calendarUrl, "_blank");
  };

  const handleOpenChat = () => {
    const link = `https://wa.me/917014885565?text=${encodeURIComponent(
      `Type: Internship Help\nSource: /intern/${id}\n\nI need help with: ${internship?.title} at ${internship?.hiringOrganization}`
    )}`;
    window.open(link, "_blank");
  };

  const handleShareDialogOpenChange = (open: boolean) => {
    setShareDialogOpen(open);
  };

  const handleFlagInternship = async () => {
    if (!id || !internship || internship.isFlagged || isFlagging) {
      return;
    }

    if (!session?.user) {
      toast.error("Please sign in to flag this internship");
      return;
    }

    try {
      setIsFlagging(true);
      const response = await fetch(`/api/internships/${id}/flag`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to flag internship");
      }

      setInternship((prev) => (prev ? { ...prev, isFlagged: true } : prev));
      posthog.capture("internship_flagged", {
        internship_id: id,
        title: internship.title,
      });
      toast.success("Internship flagged for review");
    } catch (error) {
      console.error("Failed to flag internship:", error);
      toast.error("Failed to flag internship");
    } finally {
      setIsFlagging(false);
    }
  };

  if (loading || !internship) {
    return (
      <div className="flex min-h-[80vh] w-full flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#ec5b13]"></div>
      </div>
    );
  }

  // Formatting helpers (comment kept for readability)
  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-900 md:bg-[#f8f9fa]">
      {/* ============================================================
          MOBILE LAYOUT (hidden on md+)
      ============================================================ */}
      <div className="bg-[#f8f9fa] pb-36 md:hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#f8f9fa] px-5 py-4">
          <button
            onClick={() => router.back()}
            className="-ml-1 flex w-8 justify-start p-1 text-slate-800 transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[16px] font-extrabold tracking-tight text-slate-900">
            Internship Detail
          </h1>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleFlagInternship}
              disabled={isFlagging || internship.isFlagged}
              className="flex w-8 justify-end p-1 text-slate-800 transition-all active:scale-95 disabled:opacity-60"
              aria-label={
                internship.isFlagged ? "Internship flagged" : "Flag internship"
              }
            >
              {isFlagging ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Flag className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setShareDialogOpen(true)}
              className="-mr-1 flex w-8 justify-end p-1 text-slate-800 transition-all active:scale-95"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <InternshipHero internship={internship} />

        <div className="-mt-2 px-5 pb-2">
          <InternshipTabContent
            activeTab="description"
            internship={internship}
          />
        </div>

        <InternshipStickyFooter
          internship={internship}
          isBookmarked={isBookmarked}
          session={session}
          handleBookmarkClick={handleBookmarkClick}
          handleCalendarClick={handleCalendarClick}
          onSmartApplyClick={() => setSmartApplyOpen(true)}
        />
      </div>

      {/* ============================================================
          DESKTOP LAYOUT (hidden on mobile, visible on md+)
      ============================================================ */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-[1000px] px-4 pt-10 pb-16">
          <InternshipDesktopHeader
            internship={internship}
            session={session}
            isBookmarked={isBookmarked}
            handleBookmarkClick={handleBookmarkClick}
            handleCalendarClick={handleCalendarClick}
            onSmartApplyClick={() => setSmartApplyOpen(true)}
          />

          {/* Desktop Main Content Grid */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Left: Description */}
            <div className="lg:col-span-2">
              <div className="max-w-[650px] space-y-4 text-[15px] leading-relaxed text-slate-600">
                {typeof internship.description === "string" ? (
                  <p className="whitespace-pre-wrap">
                    {internship.description}
                  </p>
                ) : (
                  internship.description || <p>No description provided.</p>
                )}

                {internship.tags && internship.tags.length > 0 && (
                  <div className="mt-8">
                    <h4 className="mb-4 block font-bold text-slate-800">
                      Tags:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {internship.tags
                        .filter(
                          (tag) =>
                            !["remote", "onsite", "hybrid"].includes(
                              tag.toLowerCase()
                            )
                        )
                        .map((tag, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-600"
                          >
                            {toTitleCase(tag)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Disclaimer */}
              <div className="mt-12 border-t border-slate-200 pt-8">
                <div className="space-y-4 text-[14px] text-slate-700">
                  <div className="flex flex-wrap items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                    <p className="flex-1">
                      This opportunity has been listed by{" "}
                      {toTitleCase(internship.hiringOrganization)}. FTB is not
                      liable for any content mentioned in this opportunity or
                      the process followed by the organizers for this
                      opportunity.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Flag className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                    <button
                      type="button"
                      onClick={handleFlagInternship}
                      disabled={isFlagging || internship.isFlagged}
                      className="text-left text-[14px] font-medium text-slate-700 hover:text-[#ec5b13] disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      {isFlagging
                        ? "Flagging internship..."
                        : internship.isFlagged
                          ? "Internship flagged for review"
                          : "Flag this internship for review"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <InternshipDesktopSidebar
              internship={internship}
              handleOpenChat={handleOpenChat}
            />
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={handleShareDialogOpenChange}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogTitle className="sr-only">
            Share {internship.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Share this internship via social media or copy the link
          </DialogDescription>
          <ShareDialog
            shareUrl={shareUrl}
            title={internship.title}
            onCopy={handleCopy}
            onShare={handleShare}
          />
        </DialogContent>
      </Dialog>

      {/* Smart Apply Modal */}
      <ApplyModal
        isOpen={smartApplyOpen}
        onClose={() => setSmartApplyOpen(false)}
        opportunity={
          internship ? mapInternshipToApplyOpportunity(internship) : null
        }
      />
    </div>
  );
}
