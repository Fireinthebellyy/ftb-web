"use client";

import React, { useState } from "react";
import { useComments, useCreateComment, useDeleteComment } from "@/lib/queries";
import { Comment } from "@/types/interfaces";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Loader2, Send, Trash2, MessageSquare } from "lucide-react";
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
    <div className="flex gap-3 p-3 border-b border-gray-100 last:border-b-0">
      {/* User Avatar */}
      <div className="flex-shrink-0">
        {comment.user.image && !comment.user.image.includes("https://media.licdn.com") ? (
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={comment.user.image}
              alt={comment.user.name}
              className="object-cover"
            />
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xs uppercase">
            {comment.user.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {comment.user.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-2">
          {comment.content}
        </p>
        
        {/* Delete Button */}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(comment.id)}
            disabled={isDeleting}
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
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
  onSubmit: () => void;
}> = ({ opportunityId, onSubmit }) => {
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
      onSubmit();
    } catch (_error) {
      toast.error("Failed to post comment");
    }
  };

  if (!session?.user?.id) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Please log in to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {session.user.image && !session.user.image.includes("https://media.licdn.com") ? (
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={session.user.image}
                alt={session.user.name || "User"}
                className="object-cover"
              />
            </Avatar>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xs uppercase">
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
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {content.length}/1000
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createComment.isPending}
              className="h-8 px-3"
            >
              {createComment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
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

  const handleCommentSubmit = () => {
    // Comment submitted successfully
  };

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        Failed to load comments
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100">
      {/* Comment Input - Always visible when comment section is open */}
      <CommentInput 
        opportunityId={opportunityId} 
        onSubmit={handleCommentSubmit}
      />

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
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
