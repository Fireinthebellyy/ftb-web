"use client";

import React, { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Info,
  Lightbulb,
  Flag,
} from "lucide-react";
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
import { InternshipTabs } from "@/components/internship/InternshipTabs";
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
  const [activeTab, setActiveTab] = useState("description");
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

  const publicBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) || 
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
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Apply to: ${internship.title}`)}&dates=${formatted}/${formatted}&details=${encodeURIComponent(`Company: ${internship.hiringOrganization || "N/A"}\n\nInternship Link: ${shareUrl}`)}`;
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

  if (loading || !internship) {
    return (
      <div className="flex min-h-[80vh] w-full flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ec5b13]"></div>
      </div>
    );
  }

  // Formatting helpers (comment kept for readability)
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans md:bg-[#f8f9fa]">

      {/* ============================================================
          MOBILE LAYOUT (hidden on md+)
      ============================================================ */}
      <div className="md:hidden pb-32">
        <InternshipHero internship={internship} />
        <InternshipTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <InternshipTabContent activeTab={activeTab} internship={internship} />
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
        <div className="mx-auto max-w-[1000px] px-4 pt-10">

          <InternshipDesktopHeader
            internship={internship}
            session={session}
            isBookmarked={isBookmarked}
            handleBookmarkClick={handleBookmarkClick}
            handleCalendarClick={handleCalendarClick}
            onSmartApplyClick={() => setSmartApplyOpen(true)}
          />

          {/* Desktop Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Description */}
            <div className="lg:col-span-2">
              <div className="text-slate-600 leading-relaxed text-[15px] max-w-[650px] space-y-4">
                {typeof internship.description === "string" ? (
                  <p className="whitespace-pre-wrap">{internship.description}</p>
                ) : (
                  internship.description || <p>No description provided.</p>
                )}
                {internship.eligibility && internship.eligibility.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-bold text-slate-800 mb-3 block">Requirements:</h4>
                    <ul className="list-disc pl-5 space-y-2 mb-6 text-slate-600">
                      {internship.eligibility.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {internship.tags && internship.tags.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-bold text-slate-800 mb-4 block">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {internship.tags
                        .filter((tag) => !["remote", "onsite", "hybrid"].includes(tag.toLowerCase()))
                        .map((tag, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[13px] font-semibold">
                            {toTitleCase(tag)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Disclaimer */}
              <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="space-y-4 text-[14px] text-slate-700">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <p>The data on this page gets updated in every 15 minutes.</p>
                  </div>
                  <div className="flex items-start gap-3 flex-wrap">
                    <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <p className="flex-1">
                      This opportunity has been listed by {toTitleCase(internship.hiringOrganization)}. FTB is not liable for any content mentioned in this opportunity or the process followed by the organizers for this opportunity. However, please raise a complaint if you want FTB to look into the matter.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-3">
                    <button className="flex items-center gap-2 text-[#0066cc] font-medium hover:underline w-fit">
                      <Lightbulb className="w-4 h-4" /> Raise a Complaint
                    </button>
                    <button className="flex items-center gap-2 text-[#ec5b13] font-medium hover:underline w-fit">
                      <Flag className="w-4 h-4" /> Report An Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <InternshipDesktopSidebar internship={internship} handleOpenChat={handleOpenChat} />
          </div>

        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={handleShareDialogOpenChange}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogTitle className="sr-only">Share {internship.title}</DialogTitle>
          <DialogDescription className="sr-only">Share this internship via social media or copy the link</DialogDescription>
          <ShareDialog shareUrl={shareUrl} title={internship.title} onCopy={handleCopy} onShare={handleShare} />
        </DialogContent>
      </Dialog>

      {/* Smart Apply Modal */}
      <ApplyModal
        isOpen={smartApplyOpen}
        onClose={() => setSmartApplyOpen(false)}
        opportunity={internship ? mapInternshipToApplyOpportunity(internship) : null}
      />
    </div>
  );
}
