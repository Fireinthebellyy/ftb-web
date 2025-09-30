"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FeedbackMood = 1 | 2 | 3 | 4 | 5;

const moods: { value: FeedbackMood; label: string; emoji: string; meaning: string }[] = [
  { value: 1, label: "Very Bad", emoji: "😡", meaning: "Angry" },
  { value: 2, label: "Bad", emoji: "😞", meaning: "Sad" },
  { value: 3, label: "Medium", emoji: "😐", meaning: "Neutral" },
  { value: 4, label: "Good", emoji: "🙂", meaning: "Good" },
  { value: 5, label: "Great", emoji: "😍", meaning: "Excellent" },
];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<FeedbackMood | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!mood) return;
    try {
      setSubmitting(true);
      
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          meaning: moods.find((m) => m.value === mood)?.meaning,
          message: comment,
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast.success("Thanks for your feedback!");
      setOpen(false);
      setMood(null);
      setComment("");
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open feedback"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-black shadow-lg transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogTitle className="sr-only">Feedback</DialogTitle>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 text-center sm:text-left">
                What do you feel about our platform ?
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Your input helps us understand your needs and improve the experience.
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
                      mood === m.value ? "ring-2 ring-orange-500 bg-orange-50" : "bg-gray-50 hover:bg-gray-100"
                    )}
                    aria-label={m.label}
                  >
                    <span aria-hidden>{m.emoji}</span>
                  </button>
                  <span className="text-xs text-gray-600 font-medium">{m.meaning}</span>
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
              <Button
                onClick={handleSubmit}
                disabled={!mood || submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


