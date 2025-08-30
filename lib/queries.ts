import sanityClient from "@/lib/sanity";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Opportunity, Comment, CreateCommentData } from "@/types/interfaces";

/**
 * Existing Sanity queries (kept intact)
 */
const privacyPolicyQuery = `*[_type == "privacy"][0]{
    title,
    content,
    lastUpdated
}`;

const termsOfServiceQuery = `*[_type == "terms"][0]{
    title,
    content,
    lastUpdated
}`;

/**
 * Featured query
 */
const featuredQuery = `*[_type == "featured"] | order(priority, _createdAt desc) {
    _id,
    title,
    type,
    url,
    description,
    priority,
    thumbnail{
      _type,
      alt,
      asset->{
        _ref,
        _type,
        url
      }
    }
}`;

export const getPrivacyPolicy = async () => {
  try {
    const privacyPolicy = await sanityClient.fetch(privacyPolicyQuery);
    return privacyPolicy;
  } catch (error) {
    console.error("Sanity query error:", error);
    return null;
  }
};

export const getTermsOfService = async () => {
  try {
    const termsOfService = await sanityClient.fetch(termsOfServiceQuery);
    return termsOfService;
  } catch (error) {
    console.error("Sanity query error:", error);
    return null;
  }
};

export const getFeatured = async () => {
  try {
    const featuredItems = await sanityClient.fetch(featuredQuery);
    return featuredItems;
  } catch (error) {
    console.error("Sanity query error:", error);
    return [];
  }
};

/**
 * Upvote/opportunity client helpers using React Query + Axios
 */

export type OpportunityVoteState = {
  id: string;
  upvotes: number;
  hasUserUpvoted: boolean;
};

async function fetchOpportunityVoteState(
  id: string
): Promise<OpportunityVoteState> {
  // Hits the dedicated upvote GET endpoint which returns { count, userHasUpvoted }
  const { data } = await axios.get(`/api/opportunities/${id}/upvote`);
  return {
    id,
    upvotes: typeof data.count === "number" ? data.count : 0,
    hasUserUpvoted:
      typeof data.userHasUpvoted === "boolean" ? data.userHasUpvoted : false,
  };
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => fetchOpportunityVoteState(id),
    staleTime: 1000 * 30, // 30s
  });
}

async function toggleUpvote(id: string): Promise<OpportunityVoteState> {
  const { data } = await axios.post(`/api/opportunities/${id}/upvote`);
  return {
    id,
    upvotes: typeof data.count === "number" ? data.count : 0,
    hasUserUpvoted:
      typeof data.userHasUpvoted === "boolean" ? data.userHasUpvoted : false,
  };
}

export function useToggleUpvote(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["opportunity", id, "toggle-upvote"],
    mutationFn: () => toggleUpvote(id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["opportunity", id] });
      const prev = qc.getQueryData<OpportunityVoteState>(["opportunity", id]);

      // Optimistic update
      if (prev) {
        const nextHas = !prev.hasUserUpvoted;
        const nextCount = Math.max(0, prev.upvotes + (nextHas ? 1 : -1));
        qc.setQueryData<OpportunityVoteState>(["opportunity", id], {
          ...prev,
          hasUserUpvoted: nextHas,
          upvotes: nextCount,
        });
      }

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["opportunity", id], ctx.prev);
      }
    },
    onSuccess: (data) => {
      // Replace with server canonical state
      qc.setQueryData<OpportunityVoteState>(["opportunity", id], data);
    },
    onSettled: () => {
      // Background refetch to ensure consistency
      qc.invalidateQueries({ queryKey: ["opportunity", id] });
    },
  });
}

/**
 * Fetch list of opportunities
 */
export type OpportunitiesResponse = {
  opportunities: Opportunity[];
};

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data } = await axios.get<OpportunitiesResponse>("/api/opportunities");
  return data.opportunities;
}

export function useOpportunities() {
  return useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useFeatured(limit?: number) {
  return useQuery({
    queryKey: ["featured", limit],
    queryFn: () =>
      limit
        ? getFeatured().then((items) => items.slice(0, limit))
        : getFeatured(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Bookmarks: per-opportunity status (recommended approach, mirrors upvote flow)
 */
export function useIsBookmarked(id: string) {
  return useQuery<boolean>({
    queryKey: ["bookmark", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/bookmarks/${id}`);
      return Boolean(data?.isBookmarked);
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Comments: fetch and manage comments for opportunities
 */
export function useComments(opportunityId: string) {
  return useQuery<Comment[]>({
    queryKey: ["comments", opportunityId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/opportunities/${opportunityId}/comments`);
      return data.comments || [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateComment(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: CreateCommentData) => {
      const { data } = await axios.post(`/api/opportunities/${opportunityId}/comments`, commentData);
      return data.comment;
    },
    onSuccess: (newComment) => {
      // Optimistically add the new comment to the list
      queryClient.setQueryData<Comment[]>(["comments", opportunityId], (oldComments = []) => {
        return [newComment, ...oldComments];
      });
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
      await axios.delete(`/api/opportunities/${opportunityId}/comments/${commentId}`);
      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      // Remove the deleted comment from the list
      queryClient.setQueryData<Comment[]>(["comments", opportunityId], (oldComments = []) => {
        return oldComments.filter(comment => comment.id !== deletedCommentId);
      });
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
    },
  });
}
