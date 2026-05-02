"use client";

import { useState, useEffect } from "react";
import { MessageSquareHeart } from "lucide-react";
import posthog from "posthog-js";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FeedbackMood = 1 | 2 | 3 | 4 | 5;

const moods: {
  value: FeedbackMood;
  label: string;
  emoji: string;
  meaning: string;
}[] = [
  { value: 1, label: "Very Bad", emoji: "😡", meaning: "Angry" },
  { value: 2, label: "Bad", emoji: "😞", meaning: "Sad" },
  { value: 3, label: "Medium", emoji: "😐", meaning: "Neutral" },
  { value: 4, label: "Good", emoji: "🙂", meaning: "Good" },
  { value: 5, label: "Great", emoji: "😍", meaning: "Excellent" },
];

const FEEDBACK_STORAGE_PREFIX = "feedback_submitted";
const FEEDBACK_BLOCK_DAYS = 30;

function getFeedbackStorageKey(path?: string) {
  return `${FEEDBACK_STORAGE_PREFIX}:${path ?? "global"}`;
}

function isFeedbackBlockedForPath(path?: string) {
  try {
    if (typeof window === "undefined") return false;
    const key = getFeedbackStorageKey(path);
    const ts = localStorage.getItem(key);
    if (!ts) return false;
    const date = new Date(ts);
    if (isNaN(date.getTime())) return false;
    const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays < FEEDBACK_BLOCK_DAYS;
  } catch (err) {
    console.error("Feedback storage read error:", err);
    return false;
  }
}

function markFeedbackSubmittedForPath(path?: string) {
  try {
    if (typeof window === "undefined") return;
    const key = getFeedbackStorageKey(path);
    localStorage.setItem(key, new Date().toISOString());
  } catch (err) {
    console.error("Feedback storage write error:", err);
  }
}

export function FeedbackWidget({
  isOpen,
  onOpenChange,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const pathname = usePathname();
  const shouldHideOnPage = pathname.startsWith("/toolkit");
  const isInternshipDetailPage = pathname.startsWith("/intern/");

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  const [mood, setMood] = useState<FeedbackMood | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(isFeedbackBlockedForPath(pathname));
  }, [pathname]);

  const handleSubmit = async () => {
    if (!mood) return;
    const currentPath = pathname;

    try {
      setSubmitting(true);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          meaning: moods.find((m) => m.value === mood)?.meaning,
          message: comment,
          path: currentPath,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast.success("Thanks for your feedback!");
      posthog.capture("feedback_submitted", {
        mood,
        meaning: moods.find((m) => m.value === mood)?.meaning,
        path: currentPath,
      });
      setOpen(false);
      setMood(null);
      setComment("");
      setSubmitted(true);
      markFeedbackSubmittedForPath(currentPath);
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (shouldHideOnPage) {
    return null;
  }

  return (
    <>
      {!onOpenChange && !submitted && (
        <button
          type="button"
          aria-label="Open feedback"
          title="Share feedback"
          onClick={() => {
            setOpen(true);
            posthog.capture("feedback_widget_opened", {
              pathname,
            });
          }}
          className={cn(
            "fixed right-6 z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 focus:outline-none md:bottom-20 md:size-12",
            isInternshipDetailPage ? "bottom-[148px]" : "bottom-[124px]"
          )}
        >
          <MessageSquareHeart className="size-5 md:size-6" aria-hidden />
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogTitle className="sr-only">Feedback</DialogTitle>
          <div className="space-y-4">
            <div>
              <h3 className="text-center text-xl font-semibold text-gray-900 sm:text-left">
                What do you feel about our platform ?
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Your input helps us understand your needs and improve the
                experience.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              {moods.map((m) => (
                <div key={m.value} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full text-2xl transition",
                      mood === m.value
                        ? "bg-orange-50 ring-2 ring-orange-500"
                        : "bg-gray-50 hover:bg-gray-100"
                    )}
                    aria-label={m.label}
                    aria-pressed={mood === m.value}
                  >
                    <span aria-hidden>{m.emoji}</span>
                  </button>
                  <span className="text-xs font-medium text-gray-600">
                    {m.meaning}
                  </span>
                </div>
              ))}
            </div>

            {mood && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[96px]"
                />
              </div>
            )}

            <div className="pt-2">
              {!submitted ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!mood || submitting}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              ) : (
                <div className="text-center text-sm text-gray-600">
                  Feedback already submitted
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
