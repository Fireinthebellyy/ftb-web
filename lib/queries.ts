import sanityClient from "@/lib/sanity";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Opportunity,
  Comment,
  CreateCommentData,
  Task,
} from "@/types/interfaces";

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

  // Helper to update a single opportunity in OpportunitiesResponse
  const updateOpportunityInResponse = (
    response: OpportunitiesResponse,
    id: string,
    userHasUpvoted: boolean,
    upvoteCount: number
  ): OpportunitiesResponse => {
    return {
      ...response,
      opportunities: response.opportunities.map((opp) => {
        if (opp.id === id) {
          return {
            ...opp,
            userHasUpvoted,
            upvoteCount,
          };
        }
        return opp;
      }),
    };
  };

  return useMutation({
    mutationKey: ["opportunity", id, "toggle-upvote"],
    mutationFn: () => toggleUpvote(id),
    onMutate: async () => {
      // Optimistically update opportunities cache (handles both regular and infinite queries)
      qc.setQueriesData(
        { queryKey: ["opportunities"] },
        (old: any) => {
          if (!old) return old;

          // Handle infinite query structure: { pages: OpportunitiesResponse[], pageParams: any[] }
          if (old.pages && Array.isArray(old.pages)) {
            // Optimize: find the opportunity once instead of multiple lookups
            const allOpportunities = old.pages.flatMap(
              (page: OpportunitiesResponse) => page.opportunities
            );
            const foundOpp = allOpportunities.find((opp: Opportunity) => opp.id === id);
            const currentHasUpvoted = foundOpp?.userHasUpvoted ?? false;
            const currentCount = foundOpp?.upvoteCount ?? 0;
            
            const nextHas = !currentHasUpvoted;
            const nextCount = Math.max(0, currentCount + (nextHas ? 1 : -1));

            return {
              ...old,
              pages: old.pages.map((page: OpportunitiesResponse) =>
                updateOpportunityInResponse(page, id, nextHas, nextCount)
              ),
            };
          }

          // Handle regular query structure: OpportunitiesResponse
          if (old.opportunities && Array.isArray(old.opportunities)) {
            // Optimize: find the opportunity once instead of multiple lookups
            const foundOpp = old.opportunities.find((opp: Opportunity) => opp.id === id);
            const currentHasUpvoted = foundOpp?.userHasUpvoted ?? false;
            const currentCount = foundOpp?.upvoteCount ?? 0;
            
            const nextHas = !currentHasUpvoted;
            const nextCount = Math.max(0, currentCount + (nextHas ? 1 : -1));

            return updateOpportunityInResponse(old, id, nextHas, nextCount);
          }

          return old;
        }
      );

      return {};
    },
    onError: () => {
      // Rollback by invalidating opportunities cache
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onSuccess: (data) => {
      // Update opportunities cache with server response (handles both regular and infinite queries)
      qc.setQueriesData(
        { queryKey: ["opportunities"] },
        (old: any) => {
          if (!old) return old;

          // Handle infinite query structure
          if (old.pages && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page: OpportunitiesResponse) =>
                updateOpportunityInResponse(page, id, data.hasUserUpvoted, data.upvotes)
              ),
            };
          }

          // Handle regular query structure
          if (old.opportunities && Array.isArray(old.opportunities)) {
            return updateOpportunityInResponse(
              old,
              id,
              data.hasUserUpvoted,
              data.upvotes
            );
          }

          return old;
        }
      );
    },
    onSettled: () => {
      // Background refetch to ensure consistency
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

/**
 * Fetch list of opportunities
 */
export type OpportunitiesResponse = {
  opportunities: Opportunity[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

export async function fetchOpportunitiesPaginated(
  limit: number = 10,
  offset: number = 0,
  search?: string,
  types: string[] = [],
  tags: string[] = []
): Promise<OpportunitiesResponse> {
  const { data } = await axios.get<OpportunitiesResponse>(
    "/api/opportunities",
    {
      params: {
        limit,
        offset,
        search: search && search.length > 0 ? search : undefined,
        types: types.length > 0 ? types.join(",") : undefined,
        tags: tags.length > 0 ? tags.join(",") : undefined,
      },
    }
  );
  return data;
}

export function useOpportunitiesPaginated(limit: number = 10, offset: number = 0) {
  return useQuery<OpportunitiesResponse>({
    queryKey: ["opportunities", "paginated", limit, offset],
    queryFn: () => fetchOpportunitiesPaginated(limit, offset),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useInfiniteOpportunities(
  limit: number = 10,
  search?: string,
  types: string[] = [],
  tags: string[] = []
) {
  const serializedTypes = types.join(",");
  const serializedTags = tags.join(",");

  return useInfiniteQuery<OpportunitiesResponse>({
    queryKey: [
      "opportunities",
      "infinite",
      limit,
      search ?? "",
      serializedTypes,
      serializedTags,
    ],
    queryFn: ({ pageParam = 0 }) =>
      fetchOpportunitiesPaginated(
        limit,
        pageParam as number,
        search,
        types,
        tags
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasMore) {
        return (lastPage.pagination.offset || 0) + (lastPage.pagination.limit || limit);
      }
      return undefined;
    },
    staleTime: 1000 * 30, // 30 seconds
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
      const { data } = await axios.get(
        `/api/opportunities/${opportunityId}/comments`
      );
      return data.comments || [];
    },
    staleTime: 1000 * 30, // 30 seconds
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
      // Optimistically add the new comment to the list
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
      // Remove the deleted comment from the list
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

export async function fetchBookmarkDatesForMonth(
  month: string
): Promise<string[]> {
  try {
    const { data } = await axios.get<{ dates?: string[] }>("/api/bookmarks", {
      params: { month },
    });

    // Normalize to an array of strings
    return Array.isArray(data?.dates) ? data.dates : [];
  } catch (error) {
    console.error("Error fetching bookmark dates for month:", error);
    return [];
  }
}

export function useBookmarkDatesForMonth(month?: string) {
  return useQuery<string[]>({
    queryKey: ["bookmarks", "month", month],
    queryFn: () => fetchBookmarkDatesForMonth(month as string),
    enabled: Boolean(month),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Tasks: fetch and manage user tasks
 */
export type TasksResponse = {
  tasks: Task[];
};

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await axios.get<TasksResponse>("/api/tasks");
  return data.tasks;
}

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    staleTime: 1000 * 60, // 1 minute
  });
}

export type CreateTaskData = {
  title: string;
  description?: string;
};

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      const { data } = await axios.post("/api/tasks", taskData);
      return data.task;
    },
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Error creating task:", error);
    },
  });
}
export type UpdateTaskData = {
  id: string;
  title?: string;
  description?: string;
  opportunityLink?: string;
  completed?: boolean;
};

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: UpdateTaskData) => {
      const { data } = await axios.put(`/api/tasks/${taskData.id}`, taskData);
      return data.task;
    },
    onMutate: async (taskData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Optimistically update the task in the cache
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["tasks"],
          previousTasks.map((task) =>
            task.id === taskData.id ? { ...task, ...taskData } : task
          )
        );
      }

      // Return context with the previous tasks and updating task id
      return { previousTasks, updatingTaskId: taskData.id };
    },
    onError: (error, taskData, context) => {
      console.error("Error updating task:", error);
      // Rollback to the previous state
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      // Invalidate and refetch tasks to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await axios.delete(`/api/tasks/${taskId}`);
      return data.success;
    },
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
    },
  });
}

/**
 * Onboarding profile
 */
export type OnboardingProfile = {
  persona?: "student" | "society";
  locationType?: "city" | "state" | null;
  locationValue?: string | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  fieldOther?: string | null;
  opportunityInterests?: string[] | null;
  domainPreferences?: string[] | null;
  struggles?: string[] | null;
};

export type SaveOnboardingProfileInput = {
  persona: "student" | "society";
  locationType?: "city" | "state";
  locationValue?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  fieldOther?: string;
  opportunityInterests?: string[];
  domainPreferences?: string[];
  struggles?: string[];
};

export async function fetchOnboardingProfile(): Promise<OnboardingProfile | null> {
  try {
    const { data } = await axios.get<{ profile?: OnboardingProfile }>("/api/onboarding");
    return data?.profile ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function saveOnboardingProfile(
  payload: SaveOnboardingProfileInput
): Promise<OnboardingProfile> {
  const { data } = await axios.post<{ profile: OnboardingProfile }>("/api/onboarding", payload);
  return data.profile;
}
