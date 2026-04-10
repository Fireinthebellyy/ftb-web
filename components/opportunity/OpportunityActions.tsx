import {
  Flame,
  MessageSquare,
  Bookmark,
  Share2,
  EllipsisVertical,
  Trash2,
  PencilLine,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToggleUpvote } from "@/lib/queries-opportunities";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { ShareDialog } from "./ShareDialog";
import CommentSection from "./CommentSection";
import { OpportunityPostProps } from "@/types/interfaces";
import posthog from "posthog-js";
import { addUtmParams } from "@/lib/utils";

interface OpportunityActionsProps {
  opportunity: OpportunityPostProps["opportunity"];
  isBookmarked: boolean;
  onBookmarkChange: (id: string, newState: boolean) => void;
  showComments: boolean;
  setShowComments: (show: boolean) => void;
  onEdit: () => void;
}

export function OpportunityActions({
  opportunity,
  isBookmarked,
  onBookmarkChange,
  showComments,
  setShowComments,
  onEdit,
}: OpportunityActionsProps) {
  const { id, user, userHasUpvoted } = opportunity;
  const { data: session } = useSession();
  const toggleUpvote = useToggleUpvote(id);
  const actionIconClass =
    "h-4 w-4 transition-transform duration-150 ease-out motion-reduce:transform-none sm:h-5 sm:w-5 group-hover:scale-110 group-focus-visible:scale-110";

  const publicBaseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = publicBaseUrl
    ? `${publicBaseUrl}/opportunities/${id}`
    : `/opportunities/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      posthog.capture("opportunity_shared", {
        opportunity_id: id,
        title: opportunity.title,
        method: "copy",
      });
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (method: string) => {
    posthog.capture("opportunity_shared", {
      opportunity_id: id,
      title: opportunity.title,
      method,
    });
  };

  const handleDeletePost = async () => {
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
      if (res.status === 200 || res.status === 204) {
        toast.success("Post deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  return (
    <>
      <footer className="flex items-center justify-between border-t border-gray-100 pt-1">
        <div className="flex h-9 items-center space-x-4 text-gray-500 sm:space-x-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => {
                if (!toggleUpvote.isPending) {
                  toggleUpvote.mutate(undefined, {
                    onSuccess: (data) => {
                      if (data.hasUserUpvoted) {
                        toast.success(
                          "Great taste! We'll recommend more opportunities like this in the future. Save to tracker and add to calendar to never miss a deadline!",
                          {
                            duration: 5000,
                            style: {
                              alignItems: "start",
                            },
                          }
                        );
                      }
                    },
                  });
                }
              }}
              title="Upvote"
              aria-label="Upvote"
              disabled={toggleUpvote.isPending}
              className={`group flex cursor-pointer place-items-center text-xs transition-colors sm:text-sm ${
                userHasUpvoted
                  ? "fill-orange-500 text-orange-600"
                  : "hover:text-orange-600"
              } ${toggleUpvote.isPending ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Flame
                className={`${actionIconClass} ${
                  userHasUpvoted ? "fill-current" : ""
                }`}
              />
            </button>
            <button
              type="button"
              title="Comments"
              onClick={() => setShowComments(!showComments)}
              aria-label="Comments"
              className="group flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
            >
              <MessageSquare className={actionIconClass} />
            </button>
            <button
              type="button"
              title="Track"
              onClick={() => {
                if (!session?.user?.id) {
                  toast.error("Please log in to track opportunities");
                  return;
                }

                onBookmarkChange(id, !isBookmarked);
              }}
              aria-label="Track"
              className="group flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
            >
              <Bookmark
                className={`${actionIconClass} ${
                  isBookmarked
                    ? "fill-yellow-400 text-yellow-500"
                    : "hover:text-orange-600"
                }`}
              />
            </button>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  title="Share"
                  aria-label="Share"
                  className="group flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
                >
                  <Share2 className={actionIconClass} />
                </button>
              </DialogTrigger>
              <ShareDialog
                shareUrl={shareUrl}
                title={opportunity.title}
                onCopy={handleCopy}
                onShare={handleShare}
              />
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {opportunity.applyLink && (
            <Link
              href={addUtmParams(opportunity.applyLink, "opportunity_card")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                className="h-7 cursor-pointer rounded-lg border-none bg-orange-600 px-2 text-[10px] font-bold text-white shadow-none transition-all hover:bg-orange-700 active:scale-95 sm:h-8 sm:px-3 sm:text-xs"
              >
                Apply
              </Button>
            </Link>
          )}
          <a
              href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                `Apply to: ${opportunity.title}`
              )}&dates=${(() => {
                let date: Date;
                if (opportunity.endDate) {
                  date = new Date(opportunity.endDate);
                } else {
                  const baseDate = opportunity.createdAt
                    ? new Date(opportunity.createdAt)
                    : new Date();
                  date = new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000);
                }
                const formatted = date
                  .toISOString()
                  .replace(/[-:]|\.\d{3}/g, "");
                return `${formatted}/${formatted}`;
              })()}&details=${encodeURIComponent(
                `Check out this opportunity: ${opportunity.title}\n\nLink: ${shareUrl}`
              )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Add to calendar"
            className="group flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-blue-50"
          >
            <Image
              src="/images/google-calendar.webp"
              alt="Google Calendar"
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
          </a>

          {session?.user?.id === user?.id && (
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <EllipsisVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-42">
                  <DropdownMenuItem
                    onClick={onEdit}
                    className="flex items-center gap-2"
                  >
                    <PencilLine />
                    <p className="text-muted-foreground text-sm">Edit Post</p>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to delete this post?")
                      ) {
                        handleDeletePost();
                      }
                    }}
                  >
                    <Trash2 />
                    <p className="text-muted-foreground text-sm">Delete Post</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </footer>

      {showComments && <CommentSection opportunityId={id} />}
    </>
  );
}
