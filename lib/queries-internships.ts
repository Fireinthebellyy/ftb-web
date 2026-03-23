import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Internship } from "@/types/interfaces";

export type InternshipsResponse = {
  internships: Internship[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

export async function fetchInternshipsPaginated(
  limit: number = 10,
  offset: number = 0,
  search?: string,
  types: string[] = [],
  tags: string[] = [],
  location?: string,
  minStipend?: number,
  maxStipend?: number,
  ids?: string[]
): Promise<InternshipsResponse> {
  if (typeof window === "undefined") {
    return { internships: [] };
  }
  const { data } = await axios.get<InternshipsResponse>("/api/internships", {
    params: {
      limit,
      offset,
      search: search && search.length > 0 ? search : undefined,
      types: types.length > 0 ? types.join(",") : undefined,
      tags: tags.length > 0 ? tags.join(",") : undefined,
      location: location && location.length > 0 ? location : undefined,
      minStipend: minStipend !== undefined ? minStipend : undefined,
      maxStipend: maxStipend !== undefined ? maxStipend : undefined,
      ids: ids && ids.length > 0 ? ids.join(",") : undefined,
    },
  });
  return data;
}

export function useInfiniteInternships(
  limit: number = 10,
  search?: string,
  types: string[] = [],
  tags: string[] = [],
  location?: string,
  minStipend?: number,
  maxStipend?: number
) {
  const serializedTypes = types.join(",");
  const serializedTags = tags.join(",");

  return useInfiniteQuery<InternshipsResponse>({
    queryKey: [
      "internships",
      "infinite",
      limit,
      search ?? "",
      serializedTypes,
      serializedTags,
      location ?? "",
      minStipend ?? "",
      maxStipend ?? "",
    ],
    queryFn: ({ pageParam = 0 }) =>
      fetchInternshipsPaginated(
        limit,
        pageParam as number,
        search,
        types,
        tags,
        location,
        minStipend,
        maxStipend
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
    staleTime: 1000 * 30,
  });
}

export function useInternship(id: string) {
  return useQuery({
    queryKey: ["internship", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/internships/${id}`);
      return data.internship;
    },
    staleTime: 1000 * 30,
  });
}
