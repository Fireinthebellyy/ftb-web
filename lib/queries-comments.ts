import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Comment, CreateCommentData } from "@/types/interfaces";

export function useComments(opportunityId: string) {
  return useQuery<Comment[]>({
    queryKey: ["comments", opportunityId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/opportunities/${opportunityId}/comments`
      );
      return data.comments || [];
    },
    staleTime: 1000 * 30,
  });
}

export function useCreateComment(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: CreateCommentData) => {
      const { data } = await axios.post(
        `/api/opportunities/${opportunityId}/comments`,
        commentData
      );
      return data.comment;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(
        ["comments", opportunityId],
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

export function useDeleteComment(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await axios.delete(
        `/api/opportunities/${opportunityId}/comments/${commentId}`
      );
      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      queryClient.setQueryData<Comment[]>(
        ["comments", opportunityId],
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
