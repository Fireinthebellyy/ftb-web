"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, User } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";

type Comment = {
  id: string;
  content: string;
  userName: string;
  createdAt: string;
};

interface CommentSectionProps {
  opportunityId: string;
}

export default function CommentSection({ opportunityId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [opportunityId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/comments?opportunityId=${opportunityId}`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await axios.post("/api/comments", {
        opportunityId,
        content: newComment.trim(),
      });

      setComments(prev => [response.data.comment, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="mb-4">
        <div className="flex gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gray-100 text-gray-600">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="text-sm"
              disabled={submitting}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || submitting}
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">Loading comments...</div>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                  {comment.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.userName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">No comments yet. Be the first to comment!</div>
          </div>
        )}
      </div>
    </div>
  );
} 