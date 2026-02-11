import { useState, useEffect } from "react";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  EllipsisVertical,
  Trash2,
  PencilLine,
} from "lucide-react";
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
  const [showMessage, setShowMessage] = useState(false);

  const publicBaseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = publicBaseUrl
    ? `${publicBaseUrl}/opportunities/${id}`
    : `/opportunities/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
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

  useEffect(() => {
    if (showMessage) {
      toast.success(
        isBookmarked ? "Added to bookmarks" : "Removed from bookmarks"
      );
      const timer = setTimeout(() => setShowMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showMessage, isBookmarked]);

  return (
    <>
      <footer className="flex items-center justify-between border-t border-gray-100 pt-1">
        <div className="flex h-9 items-center space-x-4 text-gray-500 sm:space-x-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => !toggleUpvote.isPending && toggleUpvote.mutate()}
              title="Upvote"
              aria-label="Upvote"
              disabled={toggleUpvote.isPending}
              className={`flex cursor-pointer place-items-center text-xs transition-colors sm:text-sm ${
                userHasUpvoted
                  ? "fill-orange-500 text-orange-600"
                  : "hover:text-orange-600"
              } ${toggleUpvote.isPending ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Heart
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  userHasUpvoted ? "fill-current" : ""
                }`}
              />
            </button>
            <button
              type="button"
              title="Comments"
              onClick={() => setShowComments(!showComments)}
              aria-label="Comments"
              className="flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              title="Bookmark"
              onClick={() => {
                if (!session?.user?.id) {
                  toast.error("Please log in to bookmark opportunities");
                  return;
                }
                onBookmarkChange(id, !isBookmarked);
                setShowMessage(true);
              }}
              aria-label="Bookmark"
              className="flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
            >
              <Bookmark
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
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
                  className="flex cursor-pointer items-center text-xs transition-colors hover:text-orange-600 sm:text-sm"
                >
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </DialogTrigger>
              <ShareDialog
                shareUrl={shareUrl}
                title={opportunity.title}
                onCopy={handleCopy}
              />
            </Dialog>
          </div>
        </div>
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
                    if (confirm("Are you sure you want to delete this post?")) {
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
      </footer>

      {showComments && <CommentSection opportunityId={id} />}
    </>
  );
}
