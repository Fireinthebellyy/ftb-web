"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Share2, Bookmark, Code, Paintbrush, Megaphone, Calculator, Briefcase, Database, Layout, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { InternshipPostProps } from "@/types/interfaces";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toTitleCase, cn } from "@/lib/utils";
import { ShareDialog } from "./internship/ShareDialog";
import { useTracker } from "@/components/providers/TrackerProvider";

const getDomainIcon = (title: string, className: string = "w-5 h-5 text-white") => {
  const t = title.toLowerCase();
  if (t.includes("develop") || t.includes("software") || t.includes("engineer") || t.includes("tech")) return <Code className={className} />;
  if (t.includes("design") || t.includes("ui") || t.includes("visual") || t.includes("creative")) return <Paintbrush className={className} />;
  if (t.includes("market") || t.includes("seo") || t.includes("social") || t.includes("content")) return <Megaphone className={className} />;
  if (t.includes("data") || t.includes("analy") || t.includes("machine") || t.includes("ai")) return <Database className={className} />;
  if (t.includes("finance") || t.includes("account") || t.includes("business") || t.includes("sales")) return <Calculator className={className} />;
  if (t.includes("product") || t.includes("manage") || t.includes("admin")) return <Layout className={className} />;
  if (t.includes("intern") || t.includes("trainee")) return <Lightbulb className={className} />;
  return <Briefcase className={className} />;
};

const getGradient = (id: string | number) => {
  const gradients = [
    "bg-linear-to-br from-purple-500 to-indigo-500",
    "bg-linear-to-br from-pink-500 to-rose-500",
    "bg-linear-to-br from-emerald-400 to-teal-500",
    "bg-linear-to-br from-orange-400 to-red-500",
    "bg-linear-to-br from-blue-400 to-cyan-500",
    "bg-linear-to-br from-amber-400 to-orange-500",
  ];
  const hash = String(id).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

const InternshipPost: React.FC<InternshipPostProps> = ({ internship }) => {
  const router = useRouter();
  const { addToTracker, getStatus, removeFromTracker } = useTracker();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const {
    id,
    title,
    hiringOrganization,
    deadline,
  } = internship;

  const currentStatus = getStatus(id, "internship");
  const isBookmarked = !!currentStatus;

  const handleCardClick = () => {
    posthog.capture("internship_card_clicked", {
      internship_id: id,
      title,
    });
    router.push(`/intern/${id}`);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isBookmarked) {
        await removeFromTracker(id, "internship");
      } else {
        await addToTracker(id, "Not Applied", "internship");
      }
    } catch (error) {
      console.error("Failed to update tracker:", error);
      toast.error("Failed to update tracker");
    }
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
      posthog.capture("internship_shared", {
        internship_id: id,
        title,
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
      title,
      method,
    });
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
        className="group cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-[#ec5b13]/30 hover:shadow-md hover:bg-orange-50/10"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Desktop domain icon */}
            <div className="hidden sm:flex shrink-0 w-11 h-11 rounded-full shadow-sm overflow-hidden border border-white/50">
              <div className={cn("w-full h-full flex items-center justify-center", getGradient(id))}>
                {getDomainIcon(title)}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {toTitleCase(title)}
              </h3>
              <p className="truncate text-xs text-slate-500 sm:text-sm">
                {toTitleCase(hiringOrganization)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Apply to: ${title}`)}&dates=${(() => {
                const date = deadline
                  ? new Date(deadline)
                  : new Date(Date.now() + 24 * 60 * 60 * 1000);
                const formatted = date
                  .toISOString()
                  .replace(/[-:]|\.\d{3}/g, "");
                return `${formatted}/${formatted}`;
              })()}&details=${encodeURIComponent(`Company: ${hiringOrganization || "N/A"}\n\nInternship Link: ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Add to calendar"
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-blue-50"
            >
              <Image
                src="/images/google-calendar.webp"
                alt="Google Calendar"
                width={16}
                height={16}
                className="h-4 w-4 object-contain"
              />
            </a>
            
            <button
              type="button"
              title="Share"
              aria-label="Share"
              onClick={handleShareClick}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-orange-50 hover:text-[#ec5b13]"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              title={isBookmarked ? "Remove from Tracker" : "Save to Tracker"}
              aria-label={isBookmarked ? "Remove from Tracker" : "Save to Tracker"}
              onClick={handleSaveClick}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                isBookmarked 
                  ? "bg-orange-100 text-[#ec5b13]" 
                  : "text-slate-400 hover:bg-orange-50 hover:text-[#ec5b13]"
              )}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
          <ShareDialog
            shareUrl={shareUrl}
            title={title}
            onCopy={handleCopy}
            onShare={handleShare}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InternshipPost;
