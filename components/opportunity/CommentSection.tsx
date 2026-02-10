"use client";

import React, { useState } from "react";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/lib/queries-comments";
import { Comment } from "@/types/interfaces";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentSectionProps {
  opportunityId: string;
}

const CommentItem: React.FC<{
  comment: Comment;
  currentUserId?: string;
  onDelete: (commentId: string) => void;
  isDeleting: boolean;
}> = ({ comment, currentUserId, onDelete, isDeleting }) => {
  const canDelete = currentUserId === comment.userId;

  return (
    <div className="flex gap-3 border-b border-gray-100 p-3 last:border-b-0">
      {/* User Avatar */}
      <div className="flex-shrink-0">
        {comment.user.image &&
        !comment.user.image.includes("https://media.licdn.com") ? (
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={comment.user.image}
              alt={comment.user.name}
              className="object-cover"
            />
          </Avatar>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-gray-600 uppercase">
            {comment.user.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {comment.user.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="mb-2 text-sm leading-relaxed text-gray-700">
          {comment.content}
        </p>

        {/* Delete Button */}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(comment.id)}
            disabled={isDeleting}
            className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            <span className="ml-1">Delete</span>
          </Button>
        )}
      </div>
    </div>
  );
};

const CommentInput: React.FC<{
  opportunityId: string;
}> = ({ opportunityId }) => {
  const [content, setContent] = useState("");
  const { data: session } = authClient.useSession();
  const createComment = useCreateComment(opportunityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error("Please log in to comment");
      return;
    }

    if (!content.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (content.length > 1000) {
      toast.error("Comment is too long");
      return;
    }

    try {
      await createComment.mutateAsync({ content: content.trim() });
      setContent("");
      toast.success("Comment posted successfully");
    } catch (_error) {
      toast.error("Failed to post comment");
    }
  };

  if (!session?.user?.id) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Please log in to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {session.user.image &&
          !session.user.image.includes("https://media.licdn.com") ? (
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={session.user.image}
                alt={session.user.name || "User"}
                className="object-cover"
              />
            </Avatar>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-gray-600 uppercase">
              {session.user.name
                ? session.user.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                : "U"}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[60px] resize-none text-sm"
            maxLength={1000}
            disabled={createComment.isPending}
          />
          <div className="mt-2 flex items-start justify-between">
            <span className="text-xs text-gray-500">{content.length}/1000</span>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createComment.isPending}
              className="h-8 px-3"
            >
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-1">Post</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({ opportunityId }) => {
  const { data: session } = authClient.useSession();
  const { data: comments = [], isLoading, error } = useComments(opportunityId);
  const deleteComment = useDeleteComment(opportunityId);

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId);
      toast.success("Comment deleted successfully");
    } catch (_error) {
      toast.error("Failed to delete comment");
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-500">
        Failed to load comments
      </div>
    );
  }

  return (
    <div className="mt-2 border-t border-gray-100">
      <CommentInput opportunityId={opportunityId} />

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={session?.user?.id}
                onDelete={handleDelete}
                isDeleting={deleteComment.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
