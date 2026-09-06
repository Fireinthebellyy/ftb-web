"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { Youtube } from "lucide-react";

interface OpportunityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  guideUrl?: string | null;
}

export function OpportunityGuideModal({
  isOpen,
  onClose,
  title,
  guideUrl,
}: OpportunityGuideModalProps) {
  const embedUrl = getYouTubeEmbedUrl(guideUrl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gray-950 border-gray-800 text-white rounded-xl shadow-2xl">
        <DialogHeader className="px-5 py-3.5 bg-gray-900/90 border-b border-gray-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold text-gray-100 flex items-center gap-2 line-clamp-1 pr-6">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
              <Youtube className="h-4 w-4 fill-red-500 text-red-500" />
            </span>
            <span>Guide: {title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`Guide for ${title}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="text-gray-400 text-sm p-8 text-center">
              Unable to load YouTube video guide.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
