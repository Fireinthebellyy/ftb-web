"use client";

import { useMemo } from "react";
import { useDashboardBootstrap } from "@/lib/queries-dashboard";
import {
  useInfiniteOpportunities,
} from "@/lib/queries-opportunities";
import { AVAILABLE_TYPES } from "./constants";
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
  
  const allSelected = selectedTypes.length === AVAILABLE_TYPES.length;
  const noneSelected = selectedTypes.length === 0;
  const isFilterEmpty = normalizedSearchTerm.length === 0 && selectedTags.length === 0;

  const normalizedTypes = useMemo(() => {
    // If all are selected, we don't send any type filter to the API (which the backend treats as "all")
    if (allSelected) return [];
    // If none are selected, return null as a sentinel
    if (noneSelected) return null;
    return [...selectedTypes].sort();
  }, [selectedTypes, allSelected, noneSelected]);

  const normalizedTags = useMemo(
    () => selectedTags.map((tag) => tag.toLowerCase()).sort(),
    [selectedTags]
  );
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Use bootstrap only when all types are selected and there are no other filters
  const shouldUseBootstrap = isFilterEmpty && allSelected;
  
  // If no types are selected, we should show nothing (suppress queries)
  const shouldShowNothing = noneSelected;

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

  const shouldEnableInfiniteQuery = !shouldUseBootstrap && !shouldShowNothing;

  const opportunitiesQuery = useInfiniteOpportunities(
    10,
    normalizedSearchTerm,
    normalizedTypes,
    normalizedTags,
    { enabled: shouldEnableInfiniteQuery }
  );

  const allOpportunities = useMemo(() => {
    const flat = opportunitiesQuery.data?.pages?.flatMap((page) => page.opportunities) || [];
    const seen = new Set<string>();
    return flat.filter((opp) => {
      if (seen.has(opp.id)) return false;
      seen.add(opp.id);
      return true;
    });
  }, [opportunitiesQuery.data]);

  const isLoading =
    (shouldUseBootstrap && bootstrapQuery.isPending) ||
    opportunitiesQuery.isLoading;

  return {
    normalizedSearchTerm,
    shouldUseBootstrap,
    isBootstrapPending: shouldUseBootstrap && bootstrapQuery.isPending,
    bootstrapTasks: bootstrapQuery.data?.tasks ?? [],
    bootstrapMonth: bootstrapQuery.data?.month,
    bootstrapBookmarkDates: bootstrapQuery.data?.bookmarkDates ?? [],
    allOpportunities,
    isLoading,
    error: opportunitiesQuery.error,
    fetchNextPage: opportunitiesQuery.fetchNextPage,
    hasNextPage: opportunitiesQuery.hasNextPage,
    isFetchingNextPage: opportunitiesQuery.isFetchingNextPage,
  };
}
