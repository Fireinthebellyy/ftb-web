"use client";

import { useMemo } from "react";
import { useDashboardBootstrap } from "@/lib/queries-dashboard";
import {
  useBookmarkStatuses,
  useInfiniteOpportunities,
} from "@/lib/queries-opportunities";

interface UseOpportunityFeedParams {
  debouncedSearchTerm: string;
  selectedTypes: string[];
  selectedTags: string[];
}

export function useOpportunityFeed({
  debouncedSearchTerm,
  selectedTypes,
  selectedTags,
}: UseOpportunityFeedParams) {
  const normalizedSearchTerm = debouncedSearchTerm.trim();
  const normalizedTypes = useMemo(
    () => [...selectedTypes].sort(),
    [selectedTypes]
  );
  const normalizedTags = useMemo(
    () => selectedTags.map((tag) => tag.toLowerCase()).sort(),
    [selectedTags]
  );
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const shouldUseBootstrap =
    normalizedSearchTerm.length === 0 &&
    normalizedTypes.length === 0 &&
    normalizedTags.length === 0;

  const bootstrapQuery = useDashboardBootstrap(
    {
      limit: 10,
      search: normalizedSearchTerm,
      types: normalizedTypes,
      tags: normalizedTags,
      month: currentMonthKey,
    },
    {
      enabled: shouldUseBootstrap,
    }
  );

  const shouldEnableInfiniteQuery =
    !shouldUseBootstrap || bootstrapQuery.isSuccess || bootstrapQuery.isError;

  const opportunitiesQuery = useInfiniteOpportunities(
    10,
    normalizedSearchTerm,
    normalizedTypes,
    normalizedTags,
    { enabled: shouldEnableInfiniteQuery }
  );

  const allOpportunities = useMemo(
    () =>
      opportunitiesQuery.data?.pages?.flatMap((page) => page.opportunities) ||
      [],
    [opportunitiesQuery.data]
  );
  const opportunityIds = useMemo(
    () => allOpportunities.map((opportunity) => opportunity.id),
    [allOpportunities]
  );
  const bookmarkStatusesQuery = useBookmarkStatuses(opportunityIds);

  const isLoading =
    (shouldUseBootstrap && bootstrapQuery.isPending) ||
    opportunitiesQuery.isLoading;

  return {
    normalizedSearchTerm,
    allOpportunities,
    bookmarkStatuses: bookmarkStatusesQuery.data ?? {},
    isLoading,
    error: opportunitiesQuery.error,
    fetchNextPage: opportunitiesQuery.fetchNextPage,
    hasNextPage: opportunitiesQuery.hasNextPage,
    isFetchingNextPage: opportunitiesQuery.isFetchingNextPage,
  };
}
