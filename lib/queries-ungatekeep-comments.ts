import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UngatekeepComment, CreateCommentData } from "@/types/interfaces";

export function useUngatekeepComments(postId: string) {
  return useQuery<UngatekeepComment[]>({
    queryKey: ["ungatekeep-comments", postId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/ungatekeep/${postId}/comments`
      );
      return data.comments || [];
    },
    staleTime: 1000 * 30,
  });
}

export function useCreateUngatekeepComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: CreateCommentData) => {
      const { data } = await axios.post(
        `/api/ungatekeep/${postId}/comments`,
        commentData
      );
      return data.comment;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData<UngatekeepComment[]>(
        ["ungatekeep-comments", postId],
        (oldComments = []) => {
          return [newComment, ...oldComments];
        }
      );
    },
    onError: (error) => {
      console.error("Error creating comment:", error);
    },
  });
}

export function useDeleteUngatekeepComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await axios.delete(
        `/api/ungatekeep/${postId}/comments/${commentId}`
      );
      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      queryClient.setQueryData<UngatekeepComment[]>(
        ["ungatekeep-comments", postId],
        (oldComments = []) => {
          return oldComments.filter(
            (comment) => comment.id !== deletedCommentId
          );
        }
      );
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
    },
  });
}
