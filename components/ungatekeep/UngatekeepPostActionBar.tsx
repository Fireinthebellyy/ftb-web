"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import posthog from "posthog-js";
import { Bookmark, Droplets, Flame, MessageSquare, Pin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

function RedditPill({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-200 sm:px-3",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface UngatekeepPostActionBarProps {
  postId: string;
  postTag?: string | null;
  initialScore: number;
  initialUserVote: number;
  commentCount: number;
  isSaved: boolean;
  showComments: boolean;
  askQueryHref: string;
  isPinned?: boolean;
  onSaveClick: (e: React.MouseEvent) => void;
  onCommentClick: () => void;
  isFlying?: boolean;
  flyPos?: { x: number; y: number };
}

export function UngatekeepPostActionBar({
  postId,
  postTag,
  initialScore,
  initialUserVote,
  commentCount,
  isSaved,
  showComments,
  askQueryHref,
  isPinned,
  onSaveClick,
  onCommentClick,
  isFlying = false,
  flyPos = { x: 0, y: 0 },
}: UngatekeepPostActionBarProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [comments, setComments] = useState(commentCount);
  const [isVoting, setIsVoting] = useState(false);
  const [upAnimKey, setUpAnimKey] = useState(0);
  const [downAnimKey, setDownAnimKey] = useState(0);

  useEffect(() => {
    setScore(initialScore);
    setUserVote(initialUserVote);
    setComments(commentCount);
  }, [initialScore, initialUserVote, commentCount]);

  const handleVote = async (direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoting) return;

    if (direction === "up") {
      setUpAnimKey((k) => k + 1);
    } else {
      setDownAnimKey((k) => k + 1);
    }

    setIsVoting(true);
    const prevScore = score;
    const prevVote = userVote;
    const nextVote = direction === "up" ? 1 : -1;

    let optimisticScore = score;
    let optimisticUserVote = userVote;

    if (userVote === nextVote) {
      optimisticScore = score - nextVote;
      optimisticUserVote = 0;
    } else if (userVote === 0) {
      optimisticScore = score + nextVote;
      optimisticUserVote = nextVote;
    } else {
      optimisticScore = score - userVote + nextVote;
      optimisticUserVote = nextVote;
    }

    setScore(optimisticScore);
    setUserVote(optimisticUserVote);

    try {
      const { data } = await axios.post<{ score: number; userVote: number }>(
        `/api/ungatekeep/${postId}/vote`,
        { direction }
      );
      setScore(data.score);
      setUserVote(data.userVote);
      posthog.capture("ungatekeep_vote", {
        post_id: postId,
        direction,
        score: data.score,
      });
    } catch (error) {
      setScore(prevScore);
      setUserVote(prevVote);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Please login to vote");
      } else {
        toast.error("Failed to update vote");
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <footer className="flex flex-wrap items-center gap-2 border-t px-3 py-2">
      <div
        className="inline-flex items-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-800"
        role="group"
        aria-label="Post voting"
      >
        <button
          type="button"
          disabled={isVoting}
          aria-label="Upvote"
          onClick={(e) => handleVote("up", e)}
          className={cn(
            "relative cursor-pointer overflow-visible rounded-l-full px-2.5 py-1.5 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50",
            userVote === 1 && "bg-orange-100 text-orange-600"
          )}
        >
          <motion.span
            key={upAnimKey}
            className="relative inline-flex"
            initial={{ scale: 1, y: 0 }}
            animate={{
              scale: [1, 1.45, 1.05, 1],
              y: [0, -5, -1, 0],
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Flame
              className={cn(
                "h-4 w-4",
                userVote === 1 && "fill-orange-500 text-orange-500"
              )}
            />
          </motion.span>
          {upAnimKey > 0 ? (
            <motion.span
              key={`up-burst-${upAnimKey}`}
              initial={{ opacity: 0.7, scale: 0.6 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 m-auto h-4 w-4 rounded-full bg-orange-400/50"
              aria-hidden
            />
          ) : null}
        </button>
        <button
          type="button"
          disabled={isVoting}
          aria-label="Downvote"
          onClick={(e) => handleVote("down", e)}
          className={cn(
            "relative cursor-pointer overflow-visible rounded-r-full px-2.5 py-1.5 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50",
            userVote === -1 && "bg-sky-100 text-sky-600"
          )}
        >
          <motion.span
            key={downAnimKey}
            className="relative inline-flex"
            initial={{ scale: 1, y: 0 }}
            animate={{
              scale: [1, 1.45, 1.05, 1],
              y: [0, 5, 1, 0],
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Droplets
              className={cn(
                "h-4 w-4",
                userVote === -1 && "fill-sky-500 text-sky-500"
              )}
            />
          </motion.span>
          {downAnimKey > 0 ? (
            <motion.span
              key={`down-burst-${downAnimKey}`}
              initial={{ opacity: 0.7, scale: 0.6 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 m-auto h-4 w-4 rounded-full bg-sky-400/50"
              aria-hidden
            />
          ) : null}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isPinned ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
            <Pin className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            Pinned
          </span>
        ) : null}

        <Link
          href={askQueryHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            posthog.capture("ungatekeep_ask_query_clicked", {
              post_id: postId,
              post_tag: postTag,
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-200 sm:px-3"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask query</span>
        </Link>

        <RedditPill
          onClick={(e) => {
            e.stopPropagation();
            onCommentClick();
          }}
          className={cn(showComments && "bg-orange-50 text-orange-700")}
          aria-expanded={showComments}
        >
          <MessageSquare
            className={cn("h-3.5 w-3.5", showComments && "fill-orange-500")}
          />
          <span className="hidden sm:inline">
            {comments > 0 ? comments : "Comment"}
          </span>
        </RedditPill>

        <RedditPill
          onClick={onSaveClick}
          className={cn("relative", isSaved && "bg-orange-50 text-orange-700")}
          aria-pressed={isSaved}
        >
          <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-orange-500")} />
          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
          <AnimatePresence>
            {isFlying ? (
              <motion.div
                initial={{ opacity: 1, x: flyPos.x, y: flyPos.y, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: typeof window !== "undefined" ? window.innerWidth - 100 : 0,
                  y: 50,
                  scale: 0.2,
                  rotate: 45,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeIn" }}
                className="bg-primary pointer-events-none fixed left-0 top-0 z-[9999] flex h-6 w-6 items-center justify-center rounded-full text-white shadow-lg"
                style={{ transform: "translate(-50%, -50%)" }}
              >
                <Bookmark className="h-4 w-4 fill-white" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </RedditPill>
      </div>
    </footer>
  );
}
