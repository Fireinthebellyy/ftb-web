"use client";

import React, { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Share2, Flag, Loader2, Settings, Bookmark, Pencil, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import posthog from "posthog-js";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ShareDialog } from "@/components/internship/ShareDialog";
import { useSession } from "@/hooks/use-session";
import { type InternshipData } from "@/types/interfaces";
import { LinkifyText } from "@/components/LinkifyText";

import { useTracker } from "@/components/providers/TrackerProvider";

import { InternshipHero } from "@/components/internship/InternshipHero";
import { InternshipTabContent } from "@/components/internship/InternshipTabContent";
import { InternshipDesktopHeader } from "@/components/internship/InternshipDesktopHeader";
import { InternshipSidebar } from "@/components/internship/InternshipSidebar";
import { InternshipDisclaimer } from "@/components/internship/InternshipDisclaimer";
import { InternshipStickyFooter } from "@/components/internship/InternshipStickyFooter";
import { SimilarInternships } from "@/components/internship/SimilarInternships";
import NewInternshipForm from "@/components/internship/NewInternshipForm";
import { AdminControlsModal } from "@/components/internship/AdminControlsModal";

export default function InternshipDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<InternshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const [notFoundError, setNotFoundError] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCalendarAnimating, setIsCalendarAnimating] = useState(false);
  const { data: session } = useSession();
  const { addToTracker, getStatus, removeFromTracker } = useTracker();

  const isBookmarked = !!getStatus(id || "", "internship");

  const isOwner = session?.user && session.user.id === internship?.user?.id;
  const isModerator = session?.user && (session.user.role === "admin" || session.user.role === "editor");

  const fetchData = async (signal?: AbortSignal) => {
    if (!id) return;

    try {
      const response = await fetch(`/api/internships/${id}`, signal ? { signal } : {});
      const data = await response.json();
      if (signal?.aborted) return;
      if (!response.ok || !data.success) {
        setNotFoundError(true);
        setLoading(false);
        return;
      }

      const fetchedInternship = data.internship as InternshipData;
      setInternship(fetchedInternship);
      if (typeof window !== "undefined" && fetchedInternship) {
        localStorage.setItem(
          "last_interacted_internship",
          JSON.stringify({
            id: fetchedInternship.id,
            field: fetchedInternship.field || null,
            title: fetchedInternship.title,
          })
        );
      }
      setLoading(false);
    } catch (error: any) {
      if (error.name === "AbortError" || signal?.aborted) {
        return;
      }
      console.error("Error fetching internship:", error);
      setNotFoundError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNotFoundError(false);
    setIsEditOpen(false);
    setAdminModalOpen(false);
    setShareDialogOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    fetchData(controller.signal);
    
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOpenEdit = () => setIsEditOpen(true);
  const handleCloseEdit = () => setIsEditOpen(false);

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
        const removed = await removeFromTracker(id, "internship");
        if (removed) toast.success("Deleted from Tracker");
      } else {
        const addOutcome = await addToTracker(
          {
            id,
            kind: "internship",
            title: internship.title,
            company: internship.hiringOrganization,
            location: internship.location,
            type: internship.type,
            deadline: internship.deadline,
            link:internship.link,
          },
          "Not Applied",
          "internship"
        );
        if (addOutcome === "added") {
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "last_interacted_internship",
              JSON.stringify({
                id,
                field: internship.field || null,
                title: internship.title,
              })
            );
          }
          const trackerTab = "internship";
          toast.success("Saved to Tracker", {
            action: { label: "View", onClick: () => router.push(`/tracker?tab=${trackerTab}`) },
          });
        } else if (addOutcome === "already_exists") {
          toast.info("Already in Tracker");
        } else {
          toast.error("Failed to update bookmark");
        }
      }
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleCalendarClick = () => {
    if (!internship || isCalendarAnimating) return;
    
    // Open a blank window synchronously to prevent browser popup blockers
    const newWindow = window.open("about:blank", "_blank", "noopener,noreferrer");
    
    setIsCalendarAnimating(true);
    toast.success("adding to calendar, keep hustlemaxxing!");

    const date = internship.deadline
      ? new Date(internship.deadline)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const formatted = date.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const dateEnd = new Date(date.getTime() + 30 * 60 * 1000);
    const formattedEnd = dateEnd.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Apply to: ${internship.title}`)}&dates=${formatted}/${formattedEnd}&details=${encodeURIComponent(`Company: ${internship.hiringOrganization || "N/A"}\n\nInternship Link: ${shareUrl}`)}`;
    
    setTimeout(() => {
      if (newWindow) {
        newWindow.location.href = calendarUrl;
      }
      setIsCalendarAnimating(false);
    }, 1000);
  };

  const handleOpenChat = () => {
    const link = `https://wa.me/916377492042?text=${encodeURIComponent(
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

  const handleOnInternshipUpdated = async () => {
    // Re-fetch the internship after edit
    await fetchData();
    handleCloseEdit();
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
            {isModerator && (
              <button
                onClick={() => setAdminModalOpen(true)}
                className="flex w-8 justify-end p-1 text-slate-800 transition-all active:scale-95 hover:text-[#ec5b13]"
                aria-label="Admin controls"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
            {(isOwner || isModerator) && (
              <button
                onClick={handleOpenEdit}
                className="flex w-8 justify-end p-1 text-slate-800 transition-all active:scale-95 hover:text-[#ec5b13]"
                aria-label="Edit internship"
              >
                <Pencil className="h-5 w-5" />
              </button>
            )}
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

        {/* Premium Save & Plan Actions */}
        <div className="px-5 pb-4 -mt-2 grid grid-cols-2 gap-3">
          <button
            onClick={handleBookmarkClick}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl border bg-white shadow-sm transition-all active:scale-95 text-[13px] font-bold",
              isBookmarked
                ? "border-orange-200 bg-orange-50/50 text-[#ec5b13]"
                : "border-slate-200 text-slate-600 hover:text-[#ec5b13]"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            <span>{isBookmarked ? "Saved to Tracker" : "Save to Tracker"}</span>
          </button>
          <div className="relative">
            <button
              className="relative overflow-hidden w-full flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:text-[#ec5b13] active:scale-95 text-[13px] font-bold"
              onClick={handleCalendarClick}
            >
              {isCalendarAnimating && (
                <div className="absolute inset-0 bg-white dark:bg-zinc-950 flex items-center justify-center animate-slide-in-bell z-20">
                  <Bell className="w-5 h-5 text-[#ec5b13] animate-ring-bell" />
                </div>
              )}
              <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                <Image
                  src="/images/google-calendar.webp"
                  alt="Add to Google Calendar"
                  width={16}
                  height={16}
                  className="absolute inset-0 h-4 w-4 object-contain animate-swap-calendar"
                />
                <Bell className="absolute inset-0 h-4 w-4 text-slate-500 animate-swap-bell" />
              </div>
              <span>Add to Calendar</span>
            </button>
            <div className="absolute -top-1.5 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ec5b13] text-white border-2 border-white shadow-md z-30 pointer-events-none">
              <Bell className="h-2.5 w-2.5" strokeWidth={3} />
            </div>
          </div>
        </div>

        <div className="-mt-2 px-5 pb-2">
          <InternshipTabContent
            activeTab="description"
            internship={internship}
          />
        </div>

        <div className="px-5 mt-2 pb-6">
          <InternshipSidebar
            internship={internship}
            handleOpenChat={handleOpenChat}
          />

          {/* Similar Internships */}
          <SimilarInternships
            currentId={internship.id}
            field={internship.field}
            title={internship.title}
            exactFieldOnly={true}
          />

          {/* Mobile Disclaimer */}
          <InternshipDisclaimer
            variant="mobile"
            organization={internship.hiringOrganization}
            isFlagging={isFlagging}
            isFlagged={internship.isFlagged || false}
            onFlag={handleFlagInternship}
          />
        </div>

        <InternshipStickyFooter
          internship={internship}
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
            isCalendarAnimating={isCalendarAnimating}
            onEditClick={handleOpenEdit}
            onAdminClick={() => setAdminModalOpen(true)}
          />

          {/* Desktop Main Content Grid */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Left: Description */}
            <div className="lg:col-span-2">
              <div className="max-w-[650px] space-y-4 text-[15px] leading-relaxed text-slate-600 break-words w-full overflow-hidden">
                {typeof internship.description === "string" ? (
                  <LinkifyText text={internship.description} />
                ) : (
                  internship.description || <p>No description provided.</p>
                )}

              </div>

              {/* Similar Internships */}
              <SimilarInternships
                currentId={internship.id}
                field={internship.field}
                title={internship.title}
                exactFieldOnly={true}
              />

              {/* Desktop Disclaimer */}
              <InternshipDisclaimer
                variant="desktop"
                organization={internship.hiringOrganization}
                isFlagging={isFlagging}
                isFlagged={internship.isFlagged || false}
                onFlag={handleFlagInternship}
              />
            </div>

            <InternshipSidebar
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

      {/* Edit Dialog for admins/owners */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) handleCloseEdit(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl w-[95vw]">
          <DialogTitle className="sr-only">Edit Internship</DialogTitle>
          <div className="py-2">
            {internship && (
              // Lazy import form handles both create & edit
              <NewInternshipForm
                internship={internship}
                onCancel={handleCloseEdit}
                onInternshipCreated={handleOnInternshipUpdated}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>



      {/* Admin Controls Modal */}
      <AdminControlsModal
        internship={internship}
        open={adminModalOpen}
        onOpenChange={setAdminModalOpen}
        onUpdate={setInternship}
        onDeleted={() => router.push("/internships")}
      />
    </div>
  );
}
