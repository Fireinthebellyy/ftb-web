"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import InternshipPost from "@/components/InternshipCard";
import FeedbackWidget from "@/components/FeedbackWidget";
import { useInfiniteInternships } from "@/lib/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FeaturedOpportunities from "./opportunity/FeaturedOpportunities";
import CalendarWidget from "./opportunity/CalendarWidget";
import TaskWidget from "./opportunity/TaskWidget";

const AVAILABLE_TAGS = [
  "ai",
  "biology",
  "mba",
  "startup",
  "psychology",
  "web3",
  "finance",
  "marketing",
  "design",
  "engineering",
];
const AVAILABLE_TYPES = ["part-time", "full-time", "contract", "remote"];

const formatTypeName = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ");
};

const getTypeDropdownLabel = (selected: string[], compact = false) => {
  if (selected.length === 0) return compact ? "Types" : "Internship types";
  if (selected.length === 1) return formatTypeName(selected[0]);
  return `${selected.length} types`;
};

export default function InternshipList() {
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
  const getInitialLocation = () => searchParams.get("location") || "";
  const getInitialMinStipend = () => {
    const minStipendParam = searchParams.get("minStipend");
    return minStipendParam ? Number.parseInt(minStipendParam, 10) : undefined;
  };
  const getInitialMaxStipend = () => {
    const maxStipendParam = searchParams.get("maxStipend");
    return maxStipendParam ? Number.parseInt(maxStipendParam, 10) : undefined;
  };

  const [isNewInternshipOpen, setIsNewInternshipOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(getInitialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>(getInitialSearch);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(getInitialTypes);
  const [selectedTags, setSelectedTags] = useState<string[]>(getInitialTags);
  const [location, setLocation] = useState<string>(getInitialLocation);
  const [minStipend, setMinStipend] = useState<number | undefined>(getInitialMinStipend);
  const [maxStipend, setMaxStipend] = useState<number | undefined>(getInitialMaxStipend);
  const [isFilterBoxOpen, setIsFilterBoxOpen] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);


  // Derive state from URL query parameters whenever searchParams changes (for browser navigation)
  useEffect(() => {
    const searchParam = searchParams.get("search") || "";
    const typesParam = searchParams.get("types") || "";
    const tagsParam = searchParams.get("tags") || "";
    const locationParam = searchParams.get("location") || "";
    const minStipendParam = searchParams.get("minStipend");
    const maxStipendParam = searchParams.get("maxStipend");

    const newSearchTerm = searchParam;
    const newTypes = typesParam ? typesParam.split(",").filter(Boolean) : [];
    const newTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
    const newLocation = locationParam;
    const newMinStipend = minStipendParam ? Number.parseInt(minStipendParam, 10) : undefined;
    const newMaxStipend = maxStipendParam ? Number.parseInt(maxStipendParam, 10) : undefined;

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
    setLocation((prev) => (prev !== newLocation ? newLocation : prev));
    setMinStipend((prev) => (prev !== newMinStipend ? newMinStipend : prev));
    setMaxStipend((prev) => (prev !== newMaxStipend ? newMaxStipend : prev));
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
    const currentLocation = searchParams.get("location") || "";
    const currentMinStipend = searchParams.get("minStipend");
    const currentMaxStipend = searchParams.get("maxStipend");

    // Get state values - use debouncedSearchTerm for search, immediate updates for others
    const stateSearch = debouncedSearchTerm.trim();
    const stateTypes = [...selectedTypes].sort();
    const stateTags = [...selectedTags].sort();
    const stateLocation = location.trim();
    const stateMinStipend = minStipend;
    const stateMaxStipend = maxStipend;

    // Compare values to see if URL needs updating
    const searchChanged = currentSearch !== stateSearch;
    const typesChanged =
      JSON.stringify(currentTypes) !== JSON.stringify(stateTypes);
    const tagsChanged =
      JSON.stringify(currentTags) !== JSON.stringify(stateTags);
    const locationChanged = currentLocation !== stateLocation;
    const minStipendChanged = currentMinStipend !== (stateMinStipend?.toString() || "");
    const maxStipendChanged = currentMaxStipend !== (stateMaxStipend?.toString() || "");

    // Only update URL if values actually differ
    if (!searchChanged && !typesChanged && !tagsChanged && !locationChanged && !minStipendChanged && !maxStipendChanged) {
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

    // Update location
    if (stateLocation) {
      params.set("location", stateLocation);
    }

    // Update stipend range
    if (stateMinStipend !== undefined) {
      params.set("minStipend", stateMinStipend.toString());
    }
    if (stateMaxStipend !== undefined) {
      params.set("maxStipend", stateMaxStipend.toString());
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
    location,
    minStipend,
    maxStipend,
    pathname,
    router,
    searchParams,
  ]);

  const normalizedSearchTerm = debouncedSearchTerm.trim();

  const normalizedTypesForQuery = useMemo(
    () => [...selectedTypes].sort(),
    [selectedTypes]
  );
  const normalizedTagsForQuery = useMemo(
    () => selectedTags.map((tag) => tag.toLowerCase()).sort(),
    [selectedTags]
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteInternships(
    10,
    normalizedSearchTerm,
    normalizedTypesForQuery,
    normalizedTagsForQuery,
    location.trim(),
    minStipend,
    maxStipend
  );

  const searchPlaceholders = ["Software Engineer Intern", "Data Science Intern", "Marketing Intern"];

  // Rotate placeholders every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex(
        (prev) => (prev + 1) % searchPlaceholders.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [searchPlaceholders.length]);

  // Flatten all internships from all pages
  const allInternships =
    data?.pages?.flatMap((page) => page.internships) || [];

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
  }, [handleLoadMore, allInternships.length]);

  const handleBookmarkChange = (
    internshipId: string,
    isBookmarked: boolean
  ) => {
    // TODO: handle bookmark
    console.log(
      `Internship ${internshipId} ${
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
    setLocation("");
    setMinStipend(undefined);
    setMaxStipend(undefined);
  };

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error loading internships: {(error as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full grow bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 pt-2">
        {/* Mobile: Search */}

        <div className="mb-5 lg:hidden">
          {/* Search Bar */}
          <div className="relative mb-3 bg-white">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder={searchPlaceholders[currentPlaceholderIndex]}
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

          {/* Location Input */}
          <div className="relative mb-3 bg-white">
            <Input
              placeholder="Location (e.g., Delhi, Mumbai)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pr-10"
            />
            {location && (
              <button
                type="button"
                onClick={() => setLocation("")}
                className="absolute top-1/2 right-3 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tag Badges - Above Search Bar */}
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
              className="shrink-0 cursor-pointer"
            >
              <Filter className="size-4 text-gray-600" />
            </Button>
          </div>

          {/* Types and Tags Dropdowns (mobile) */}
          {isFilterBoxOpen && (
            <div className="grid grid-cols-2 gap-2">
              {/* Types Dropdown */}
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

              {/* Stipend Range */}
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Min stipend"
                  value={minStipend || ""}
                  onChange={(e) => setMinStipend(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max stipend"
                  value={maxStipend || ""}
                  onChange={(e) => setMaxStipend(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop: 3-Column Layout */}
        <div className="hidden gap-6 lg:grid lg:grid-cols-12">
          {/* Left Sidebar - 3 columns */}
          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              {/* Search Bar - Above Quick Links */}
              <div className="relative bg-white">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder={searchPlaceholders[currentPlaceholderIndex]}
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

              {/* Quick Links */}
              <div className="rounded-lg border bg-white px-4 py-3">
                <h3 className="mb-3 font-semibold text-gray-900">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/opportunities"
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    Opportunities
                  </Link>
                  <Link
                    href="/deadlines"
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    My Deadlines
                  </Link>
                  <Link
                    href="/profile"
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    My Profile
                  </Link>
                </div>
              </div>

              {/* featured */}
              <FeaturedOpportunities />
            </div>
          </aside>

          {/* Main Content - 6 columns */}
          <main className="col-span-6 max-h-[90vh] overflow-y-scroll pr-2">
            {/* Tags in Horizontal Box with Filter Icon */}
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
                {allInternships.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {allInternships.map((internship, index) => (
                        <div key={internship.id}>
                          <InternshipPost
                            internship={internship}
                            onBookmarkChange={handleBookmarkChange}
                          />
                          {/* Place trigger at 3rd card from the end, but watch the last card for 1+ items */}
                          {index ===
                            Math.max(0, allInternships.length - 3) && (
                            <div ref={desktopTriggerRef} className="h-1" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Load more indicator - also acts as fallback trigger */}
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                      {isFetchingNextPage && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading more internships...</span>
                        </div>
                      )}
                      {!hasNextPage && allInternships.length > 0 && (
                        <div className="text-sm text-gray-500">
                          You&apos;ve reached the end of internships
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
                        No internships found
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
            {/* deadline calendar */}
            <div className="sticky top-6 space-y-6">
              <CalendarWidget />
              <TaskWidget />
            </div>

          </aside>

          
        </div>

        {/* Mobile Content (single column) */}
        <div className="lg:hidden">
          <Dialog open={isNewInternshipOpen} onOpenChange={setIsNewInternshipOpen}>
            <DialogContent className="mx-auto p-4 md:max-h-[600px] md:min-w-[600px]" overlayClassName="backdrop-blur-xs bg-black/30">
              <DialogHeader>
                <DialogTitle>Post New Internship</DialogTitle>
              </DialogHeader>
              {/* TODO: Add InternshipForm component */}
              <div>Internship form coming soon</div>
            </DialogContent>
          </Dialog>

          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="space-y-4 rounded-lg bg-white p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && (
            <>
              {allInternships.length > 0 ? (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {allInternships.map((internship, index) => (
                      <div key={internship.id}>
                        <InternshipPost
                          internship={internship}
                          onBookmarkChange={handleBookmarkChange}
                        />
                        {/* Place trigger at 3rd card from the end, but watch the last card for 1+ items */}
                        {index === Math.max(0, allInternships.length - 3) && (
                          <div ref={mobileTriggerRef} className="h-1" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Load more indicator for mobile - also acts as fallback trigger */}
                  <div className="flex justify-center py-8">
                    {isFetchingNextPage && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading more internships...</span>
                      </div>
                    )}
                    {!hasNextPage && allInternships.length > 0 && (
                      <div className="text-sm text-gray-500">
                        You've reached the end of internships
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
                      No internships found
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
    </div>
  );
}
