"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, Loader2, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OpportunityPost from "@/components/OpportunityCard";
import { NewOpportunityButton } from "@/components/opportunity/NewOpportunityButton";
import FeaturedOpportunities from "@/components/opportunity/FeaturedOpportunities";
import { TagsDropdown } from "@/components/opportunity/TagsDropdown";
import {
  AVAILABLE_TAGS,
  AVAILABLE_TYPES,
  FEATURE_FLAGS,
  getTypeDropdownLabel,
  SEARCH_PLACEHOLDERS,
  formatTypeName,
} from "./constants";
import {
  useBookmarkStatuses,
  useInfiniteOpportunities,
} from "@/lib/queries-opportunities";
import FeedbackWidget from "@/components/FeedbackWidget";
const CalendarWidget = dynamic(
  () => import("@/components/opportunity/CalendarWidget")
);
const TaskWidget = dynamic(() => import("@/components/opportunity/TaskWidget"));

export default function OpportunityCardsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL on mount
  const getInitialSearch = () => searchParams.get("search") || "";
  const getInitialTypes = () => {
    const typesParam = searchParams.get("types") || "";
    return typesParam ? typesParam.split(",").filter(Boolean) : [];
  };
  const getInitialTags = () => {
    const tagsParam = searchParams.get("tags") || "";
    return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  };

  const [isNewOpportunityOpen, setIsNewOpportunityOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(getInitialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>(getInitialSearch);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(getInitialTypes);
  const [selectedTags, setSelectedTags] = useState<string[]>(getInitialTags);
  const [isFilterBoxOpen, setIsFilterBoxOpen] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);

  // Derive state from URL query parameters whenever searchParams changes (for browser navigation)
  useEffect(() => {
    const searchParam = searchParams.get("search") || "";
    const typesParam = searchParams.get("types") || "";
    const tagsParam = searchParams.get("tags") || "";

    const newSearchTerm = searchParam;
    const newTypes = typesParam ? typesParam.split(",").filter(Boolean) : [];
    const newTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

    // Update state from URL - use functional updates to compare and only update if changed
    setSearchTerm((prev) => (prev !== newSearchTerm ? newSearchTerm : prev));
    setDebouncedSearchTerm((prev) =>
      prev !== newSearchTerm ? newSearchTerm : prev
    );
    setSelectedTypes((prev) => {
      const prevSorted = [...prev].sort();
      const newSorted = [...newTypes].sort();
      return JSON.stringify(prevSorted) !== JSON.stringify(newSorted)
        ? newTypes
        : prev;
    });
    setSelectedTags((prev) => {
      const prevSorted = [...prev].sort();
      const newSorted = [...newTags].sort();
      return JSON.stringify(prevSorted) !== JSON.stringify(newSorted)
        ? newTags
        : prev;
    });
  }, [searchParams]);

  // Debounce search term updates (400ms delay) - only for user input, not URL loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    // Cleanup timer on unmount or when searchTerm changes
    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Defer secondary widgets to prioritize primary opportunity feed.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSecondaryWidgets(true);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  // Update URL query parameters when filters change
  useEffect(() => {
    // Get current values from URL
    const currentSearch = searchParams.get("search") || "";
    const currentTypes = (searchParams.get("types") || "")
      .split(",")
      .filter(Boolean)
      .sort();
    const currentTags = (searchParams.get("tags") || "")
      .split(",")
      .filter(Boolean)
      .sort();

    // Get state values - use debouncedSearchTerm for search, immediate updates for types/tags
    const stateSearch = debouncedSearchTerm.trim();
    const stateTypes = [...selectedTypes].sort();
    const stateTags = [...selectedTags].sort();

    // Compare values to see if URL needs updating
    const searchChanged = currentSearch !== stateSearch;
    const typesChanged =
      JSON.stringify(currentTypes) !== JSON.stringify(stateTypes);
    const tagsChanged =
      JSON.stringify(currentTags) !== JSON.stringify(stateTags);

    // Only update URL if values actually differ
    if (!searchChanged && !typesChanged && !tagsChanged) {
      return;
    }

    // Build new params
    const params = new URLSearchParams();

    // Update search
    if (stateSearch) {
      params.set("search", stateSearch);
    }

    // Update types
    if (stateTypes.length > 0) {
      params.set("types", stateTypes.join(","));
    }

    // Update tags
    if (stateTags.length > 0) {
      params.set("tags", stateTags.join(","));
    }

    // Build new URL
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Only update if URL actually changed
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [
    debouncedSearchTerm,
    selectedTypes,
    selectedTags,
    pathname,
    router,
    searchParams,
  ]);

  const normalizedSearchTerm = debouncedSearchTerm.trim();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteOpportunities(
    10,
    normalizedSearchTerm,
    [...selectedTypes].sort(),
    selectedTags.map((tag) => tag.toLowerCase()).sort()
  );

  // Rotate placeholders every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex(
        (prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Flatten all opportunities from all pages
  const allOpportunities = useMemo(
    () => data?.pages?.flatMap((page) => page.opportunities) || [],
    [data]
  );

  const opportunityIds = useMemo(
    () => allOpportunities.map((opportunity) => opportunity.id),
    [allOpportunities]
  );
  const { data: bookmarkStatuses = {} } = useBookmarkStatuses(opportunityIds);

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const desktopTriggerRef = useRef<HTMLDivElement>(null);
  const mobileTriggerRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "300px", // Start loading when trigger is 300px away from viewport
      }
    );

    const currentDesktopTriggerRef = desktopTriggerRef.current;
    const currentMobileTriggerRef = mobileTriggerRef.current;

    if (currentDesktopTriggerRef) {
      observer.observe(currentDesktopTriggerRef);
    }
    if (currentMobileTriggerRef) {
      observer.observe(currentMobileTriggerRef);
    }

    return () => {
      if (currentDesktopTriggerRef) {
        observer.unobserve(currentDesktopTriggerRef);
      }
      if (currentMobileTriggerRef) {
        observer.unobserve(currentMobileTriggerRef);
      }
    };
  }, [handleLoadMore, allOpportunities.length]);

  const handleBookmarkChange = (
    opportunityId: string,
    isBookmarked: boolean
  ) => {
    // TODO: handle bookmark
    console.log(
      `Opportunity ${opportunityId} ${
        isBookmarked ? "bookmarked" : "unbookmarked"
      }`
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedTypes([]);
    setSelectedTags([]);
  };

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error loading opportunities: {(error as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full grow bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 pt-2">
        <div className="mb-5 lg:hidden">
          <div className="relative mb-3 bg-white">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder={SEARCH_PLACEHOLDERS[currentPlaceholderIndex]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 pl-10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute top-1/2 right-3 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mb-2 flex items-start justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const displayTag = tag.charAt(0).toUpperCase() + tag.slice(1);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1 text-sm ${
                      isSelected
                        ? "bg-neutral-700 text-gray-200"
                        : "bg-white text-gray-700"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    <span>{displayTag}</span>
                  </Badge>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
              className="shrink-0 cursor-pointer hover:bg-orange-600 hover:text-white"
            >
              <Filter className="size-4 text-gray-600" />
            </Button>
          </div>

          {isFilterBoxOpen && (
            <div className="grid grid-cols-2 gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {getTypeDropdownLabel(selectedTypes, true)}
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  {AVAILABLE_TYPES.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {formatTypeName(type)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <TagsDropdown
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                align="end"
                className="w-56"
              />
            </div>
          )}
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-12">
          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              <div className="relative bg-white">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder={SEARCH_PLACEHOLDERS[currentPlaceholderIndex]}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 pl-10"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute top-1/2 right-3 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="rounded-lg border bg-white px-4 py-3">
                <h3 className="mb-3 font-semibold text-gray-900">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <p
                    onClick={() => setIsNewOpportunityOpen(true)}
                    className="block cursor-pointer text-sm text-blue-600 hover:text-blue-800"
                  >
                    Post Opportunity
                  </p>
                  <Link
                    href="/deadlines"
                    prefetch={false}
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    My Deadlines
                  </Link>
                  <Link
                    href="/profile"
                    prefetch={false}
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    My Profile
                  </Link>
                </div>
              </div>

              <FeaturedOpportunities />
            </div>
          </aside>

          <main className="col-span-6 max-h-[90vh] overflow-y-scroll pr-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const displayTag = tag.charAt(0).toUpperCase() + tag.slice(1);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1 text-sm ${
                        isSelected
                          ? "bg-neutral-700 text-gray-200"
                          : "bg-white text-gray-700"
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      <span>{displayTag}</span>
                    </Badge>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
                className={`shrink-0 transition-all hover:bg-orange-600 hover:text-white ${
                  isFilterBoxOpen
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-gray-400"
                }`}
              >
                <Filter className="h-5 w-5" />
              </Button>
            </div>

            {isFilterBoxOpen && (
              <div className="mb-4 rounded-lg border bg-white p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {getTypeDropdownLabel(selectedTypes)}
                        <ChevronDown className="h-4 w-4 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64" align="start">
                      {AVAILABLE_TYPES.map((type) => (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {formatTypeName(type)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <TagsDropdown
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    align="end"
                    className="w-64"
                  />
                </div>
              </div>
            )}

            <NewOpportunityButton
              isOpen={isNewOpportunityOpen}
              onOpenChange={setIsNewOpportunityOpen}
              layout="horizontal"
            />
            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="space-y-4 rounded-lg bg-white p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && (
              <>
                {allOpportunities.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {allOpportunities.map((opportunity, index) => (
                        <div key={opportunity.id}>
                          <OpportunityPost
                            opportunity={opportunity}
                            onBookmarkChange={handleBookmarkChange}
                            initialIsBookmarked={Boolean(
                              bookmarkStatuses[opportunity.id]
                            )}
                          />
                          {index ===
                            Math.max(0, allOpportunities.length - 3) && (
                            <div ref={desktopTriggerRef} className="h-1" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div ref={loadMoreRef} className="flex justify-center py-8">
                      {isFetchingNextPage && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading more opportunities...</span>
                        </div>
                      )}
                      {!hasNextPage && allOpportunities.length > 0 && (
                        <div className="text-sm text-gray-500">
                          You&apos;ve reached the end of opportunities
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {hasNextPage && !isFetchingNextPage && (
                      <div ref={desktopTriggerRef} className="h-1" />
                    )}
                    <div className="rounded-lg border bg-white py-12 text-center">
                      <div className="mb-4 text-gray-400">
                        <Search className="mx-auto h-12 w-12" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-600">
                        No opportunities found
                      </h3>
                      <p className="mb-4 text-gray-500">
                        Try adjusting your search criteria
                      </p>
                      <Button onClick={clearFilters} variant="outline">
                        Clear Filters
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </main>

          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              {showSecondaryWidgets ? (
                <>
                  <CalendarWidget />
                  <TaskWidget />
                </>
              ) : (
                <>
                  <div className="h-80 animate-pulse rounded-lg border bg-white" />
                  <div className="h-52 animate-pulse rounded-lg border bg-white" />
                </>
              )}
              {FEATURE_FLAGS.showTrendingTags && (
                <>
                  <div className="rounded-lg border bg-white px-4 py-3">
                    <h3 className="mb-4 font-semibold text-gray-900">
                      Trending Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        #ai
                      </span>
                      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                        #blockchain
                      </span>
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                        #web3
                      </span>
                      <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-800">
                        #startup
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        <div className="lg:hidden">
          <NewOpportunityButton
            isOpen={isNewOpportunityOpen}
            onOpenChange={setIsNewOpportunityOpen}
            layout="vertical"
          />
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="space-y-4 rounded-lg bg-white p-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && (
            <>
              {allOpportunities.length > 0 ? (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {allOpportunities.map((opportunity, index) => (
                      <div key={opportunity.id}>
                        <OpportunityPost
                          opportunity={opportunity}
                          onBookmarkChange={handleBookmarkChange}
                          initialIsBookmarked={Boolean(
                            bookmarkStatuses[opportunity.id]
                          )}
                        />
                        {index === Math.max(0, allOpportunities.length - 3) && (
                          <div ref={mobileTriggerRef} className="h-1" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center py-8">
                    {isFetchingNextPage && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading more opportunities...</span>
                      </div>
                    )}
                    {!hasNextPage && allOpportunities.length > 0 && (
                      <div className="text-sm text-gray-500">
                        You&apos;ve reached the end of opportunities
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {hasNextPage && !isFetchingNextPage && (
                    <div ref={mobileTriggerRef} className="h-1" />
                  )}
                  <div className="rounded-lg border bg-white py-12 text-center">
                    <div className="mb-4 text-gray-400">
                      <Search className="mx-auto h-12 w-12" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-600">
                      No opportunities found
                    </h3>
                    <p className="mb-4 text-gray-500">
                      Try adjusting your search criteria
                    </p>
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <FeedbackWidget />
      <div className="fixed right-6 bottom-6 z-50 flex size-10 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 shadow-lg transition hover:bg-neutral-100 md:size-12">
        <Link
          href="https://wa.me/917014885565"
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with us on WhatsApp"
          aria-label="Chat with us on WhatsApp"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5 md:size-6"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
            <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
