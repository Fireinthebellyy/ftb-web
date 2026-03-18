import axios from "axios";
import { InfiniteData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/types/interfaces";
import {
  OpportunitiesResponse,
} from "@/lib/queries-opportunities";

type DashboardBootstrapResponse = {
  opportunities: OpportunitiesResponse["opportunities"];
  pagination: NonNullable<OpportunitiesResponse["pagination"]>;
  tasks: Task[];
  bookmarkDates: string[];
  bookmarkStatuses: Record<string, boolean>;
  month: string;
};

type DashboardBootstrapParams = {
  limit: number;
  search?: string;
  types: string[];
  tags: string[];
  month: string;
};

export async function fetchDashboardBootstrap(
  params: DashboardBootstrapParams
): Promise<DashboardBootstrapResponse> {
  const { data } = await axios.get<DashboardBootstrapResponse>(
    "/api/dashboard/bootstrap",
    {
      params: {
        limit: params.limit,
        search: params.search?.trim() ? params.search : undefined,
        types: params.types.length > 0 ? params.types.join(",") : undefined,
        tags: params.tags.length > 0 ? params.tags.join(",") : undefined,
        month: params.month,
      },
    }
  );

  return data;
}

function opportunitiesInfiniteKey(
  limit: number,
  search: string,
  types: string[],
  tags: string[]
) {
  return [
    "opportunities",
    "infinite",
    limit,
    search,
    types.join(","),
    tags.join(","),
  ] as const;
}

export function useDashboardBootstrap(
  params: DashboardBootstrapParams,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const normalizedSearch = params.search?.trim() ?? "";
  const sortedTypes = [...params.types].sort();
  const sortedTags = params.tags.map((tag) => tag.toLowerCase()).sort();

  const query = useQuery({
    queryKey: [
      "dashboard",
      "bootstrap",
      params.limit,
      params.search ?? "",
      params.types.join(","),
      params.tags.join(","),
      params.month,
    ],
    queryFn: async () => {
      const data = await fetchDashboardBootstrap(params);

      queryClient.setQueryData<InfiniteData<OpportunitiesResponse>>(
        opportunitiesInfiniteKey(
          params.limit,
          normalizedSearch,
          sortedTypes,
          sortedTags
        ),
        {
          pages: [
            {
              opportunities: data.opportunities,
              pagination: data.pagination,
            },
          ],
          pageParams: [0],
        }
      );

      queryClient.setQueryData<Task[]>(["tasks"], data.tasks);
      queryClient.setQueryData<string[]>(
        ["bookmarks", "month", data.month],
        data.bookmarkDates
      );

      return data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
    retry: false,
  });

  return query;
}
