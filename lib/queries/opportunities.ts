import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Opportunity, Comment, CreateCommentData } from "@/types/interfaces";

export type OpportunityVoteState = {
  id: string;
  upvotes: number;
  hasUserUpvoted: boolean;
};

async function fetchOpportunityVoteState(
  id: string
): Promise<OpportunityVoteState> {
  const { data } = await axios.get(`/api/opportunities/${id}/upvote`);
  return {
    id,
    upvotes: data.count,
    hasUserUpvoted: data.userHasUpvoted,
  };
}

export const useOpportunityVoteState = (id: string) => {
  return useQuery({
    queryKey: ["opportunity-vote", id],
    queryFn: () => fetchOpportunityVoteState(id),
    staleTime: 1000 * 30,
  });
};

export const useToggleUpvote = (opportunityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `/api/opportunities/${opportunityId}/upvote`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["opportunity-vote", opportunityId],
      });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (error: unknown) => {
      console.error("Upvote error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to upvote. Try again."
        );
      } else {
        toast.error("Failed to upvote. Try again.");
      }
    },
  });
};

export const useOpportunityComments = (opportunityId: string) => {
  return useQuery({
    queryKey: ["comments", opportunityId],
    queryFn: async () => {
      const { data } = await axios.get<Comment[]>(
        `/api/opportunities/${opportunityId}/comments`
      );
      return data;
    },
    staleTime: 1000 * 60,
  });
};

export const useCreateComment = (opportunityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: CreateCommentData) => {
      const { data } = await axios.post<Comment>(
        `/api/opportunities/${opportunityId}/comments`,
        commentData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", opportunityId] });
      toast.success("Comment added successfully");
    },
    onError: (error: unknown) => {
      console.error("Create comment error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to add comment. Try again."
        );
      } else {
        toast.error("Failed to add comment. Try again.");
      }
    },
  });
};

export const useDeleteComment = (opportunityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await axios.delete(
        `/api/opportunities/${opportunityId}/comments/${commentId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", opportunityId] });
      toast.success("Comment deleted successfully");
    },
    onError: (error: unknown) => {
      console.error("Delete comment error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to delete comment. Try again."
        );
      } else {
        toast.error("Failed to delete comment. Try again.");
      }
    },
  });
};

async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data } = await axios.get<Opportunity[]>("/api/opportunities");
  return data;
}

export const useOpportunities = () => {
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
    staleTime: 1000 * 30,
  });
};

export const useOpportunity = (id: string) => {
  return useQuery({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      const { data } = await axios.get<Opportunity>(`/api/opportunities/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.post<Opportunity>(
        "/api/opportunities",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity posted successfully!");
    },
    onError: (error: unknown) => {
      console.error("Create opportunity error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message ||
            "Failed to post opportunity. Try again."
        );
      } else {
        toast.error("Failed to post opportunity. Try again.");
      }
    },
  });
};

export const useUpdateOpportunity = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.patch<Opportunity>(
        `/api/opportunities/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] });
      toast.success("Opportunity updated successfully!");
    },
    onError: (error: unknown) => {
      console.error("Update opportunity error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message ||
            "Failed to update opportunity. Try again."
        );
      } else {
        toast.error("Failed to update opportunity. Try again.");
      }
    },
  });
};

export const useDeleteOpportunity = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/opportunities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity deleted successfully!");
    },
    onError: (error: unknown) => {
      console.error("Delete opportunity error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message ||
            "Failed to delete opportunity. Try again."
        );
      } else {
        toast.error("Failed to delete opportunity. Try again.");
      }
    },
  });
};
