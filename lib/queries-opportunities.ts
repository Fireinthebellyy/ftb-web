import axios from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { Opportunity } from "@/types/interfaces";

export type OpportunitiesResponse = {
  opportunities: Opportunity[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

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
    upvotes: typeof data.count === "number" ? data.count : 0,
    hasUserUpvoted:
      typeof data.userHasUpvoted === "boolean" ? data.userHasUpvoted : false,
  };
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => fetchOpportunityVoteState(id),
    staleTime: 1000 * 30,
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

function updateOpportunityInResponse(
  response: OpportunitiesResponse,
  id: string,
  userHasUpvoted: boolean,
  upvoteCount: number
): OpportunitiesResponse {
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
}

export function useToggleUpvote(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["opportunity", id, "toggle-upvote"],
    mutationFn: () => toggleUpvote(id),
    onMutate: async () => {
      qc.setQueriesData({ queryKey: ["opportunities"] }, (old: any) => {
        if (!old) return old;

        if (old.pages && Array.isArray(old.pages)) {
          const allOpportunities = old.pages.flatMap(
            (page: OpportunitiesResponse) => page.opportunities
          );
          const foundOpp = allOpportunities.find(
            (opp: Opportunity) => opp.id === id
          );
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

        if (old.opportunities && Array.isArray(old.opportunities)) {
          const foundOpp = old.opportunities.find(
            (opp: Opportunity) => opp.id === id
          );
          const currentHasUpvoted = foundOpp?.userHasUpvoted ?? false;
          const currentCount = foundOpp?.upvoteCount ?? 0;

          const nextHas = !currentHasUpvoted;
          const nextCount = Math.max(0, currentCount + (nextHas ? 1 : -1));

          return updateOpportunityInResponse(old, id, nextHas, nextCount);
        }

        return old;
      });

      return {};
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onSuccess: (data) => {
      qc.setQueriesData({ queryKey: ["opportunities"] }, (old: any) => {
        if (!old) return old;

        if (old.pages && Array.isArray(old.pages)) {
          return {
            ...old,
            pages: old.pages.map((page: OpportunitiesResponse) =>
              updateOpportunityInResponse(
                page,
                id,
                data.hasUserUpvoted,
                data.upvotes
              )
            ),
          };
        }

        if (old.opportunities && Array.isArray(old.opportunities)) {
          return updateOpportunityInResponse(
            old,
            id,
            data.hasUserUpvoted,
            data.upvotes
          );
        }

        return old;
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export async function fetchOpportunitiesPaginated(
  limit: number = 10,
  offset: number = 0,
  search?: string,
  types: string[] = [],
  tags: string[] = [],
  ids?: string[]
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
        ids: ids && ids.length > 0 ? ids.join(",") : undefined,
      },
    }
  );
  return data;
}

export function useOpportunitiesPaginated(
  limit: number = 10,
  offset: number = 0
) {
  return useQuery<OpportunitiesResponse>({
    queryKey: ["opportunities", "paginated", limit, offset],
    queryFn: () => fetchOpportunitiesPaginated(limit, offset),
    staleTime: 1000 * 30,
  });
}

export function useInfiniteOpportunities(
  limit: number = 10,
  search?: string,
  types: string[] = [],
  tags: string[] = [],
  options?: { enabled?: boolean }
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
        return (
          (lastPage.pagination.offset || 0) +
          (lastPage.pagination.limit || limit)
        );
      }
      return undefined;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
  });
}

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

export type BookmarkStatusesResponse = {
  bookmarked: Record<string, boolean>;
};

export const bookmarkStatusesQueryKey = ["bookmarks", "status"] as const;

export async function fetchBookmarkStatuses(
  opportunityIds: string[]
): Promise<Record<string, boolean>> {
  if (opportunityIds.length === 0) {
    return {};
  }

  const { data } = await axios.get<BookmarkStatusesResponse>(
    "/api/bookmarks/status",
    {
      params: {
        ids: opportunityIds.join(","),
      },
    }
  );

  return data.bookmarked ?? {};
}

export function useBookmarkStatuses(opportunityIds: string[]) {
  const queryClient = useQueryClient();

  return useQuery<Record<string, boolean>>({
    queryKey: bookmarkStatusesQueryKey,
    queryFn: async () => {
      const existingStatuses =
        queryClient.getQueryData<Record<string, boolean>>(
          bookmarkStatusesQueryKey
        ) ?? {};

      const uniqueIds = Array.from(new Set(opportunityIds));
      const missingIds = uniqueIds.filter(
        (opportunityId) => !(opportunityId in existingStatuses)
      );

      if (missingIds.length === 0) {
        return existingStatuses;
      }

      const fetchedStatuses = await fetchBookmarkStatuses(missingIds);

      const mergedStatuses = { ...existingStatuses };
      for (const opportunityId of missingIds) {
        mergedStatuses[opportunityId] = Boolean(fetchedStatuses[opportunityId]);
      }

      queryClient.setQueryData<Record<string, boolean>>(
        bookmarkStatusesQueryKey,
        mergedStatuses
      );

      return mergedStatuses;
    },
    enabled: opportunityIds.length > 0,
    staleTime: 1000 * 30,
    retry: false,
  });
}

export async function fetchBookmarkDatesForMonth(
  month: string
): Promise<string[]> {
  try {
    const { data } = await axios.get<{ dates?: string[] }>("/api/bookmarks", {
      params: { month },
    });

    return Array.isArray(data?.dates) ? data.dates : [];
  } catch (error) {
    console.error("Error fetching bookmark dates for month:", error);
    return [];
  }
}

export function useBookmarkDatesForMonth(
  month?: string,
  options?: { enabled?: boolean; initialData?: string[] }
) {
  return useQuery<string[]>({
    queryKey: ["bookmarks", "month", month],
    queryFn: () => fetchBookmarkDatesForMonth(month as string),
    enabled: Boolean(month) && (options?.enabled ?? true),
    initialData: options?.initialData,
    staleTime: 1000 * 60 * 5,
  });
}
