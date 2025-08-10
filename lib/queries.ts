import sanityClient from "@/lib/sanity";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Opportunity } from "@/types/interfaces";

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
