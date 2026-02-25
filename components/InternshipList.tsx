"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import InternshipPost from "@/components/InternshipCard";
import FeedbackWidget from "@/components/FeedbackWidget";
import { useInfiniteInternships } from "@/lib/queries-internships";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FeaturedOpportunities from "./opportunity/FeaturedOpportunities";
import ToolkitBanner from "./internship/ToolkitBanner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CalendarWidget = dynamic(() => import("./opportunity/CalendarWidget"));
const TaskWidget = dynamic(() => import("./opportunity/TaskWidget"));

export default function InternshipList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL on mount
  const getInitialSearch = () => searchParams.get("search") || "";
  const getInitialLocation = () => searchParams.get("location") || "";
  const getInitialType = () => searchParams.get("type") || "";

  const [isNewInternshipOpen, setIsNewInternshipOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(getInitialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>(getInitialSearch);
  const [location, setLocation] = useState<string>(getInitialLocation);
  const [type, setType] = useState<string>(getInitialType);
  const [isFilterBoxOpen, setIsFilterBoxOpen] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);

  // Derive state from URL query parameters whenever searchParams changes (for browser navigation)
  useEffect(() => {
    const searchParam = searchParams.get("search") || "";
    const locationParam = searchParams.get("location") || "";
    const typeParam = searchParams.get("type") || "";

    const newSearchTerm = searchParam;
    const newLocation = locationParam;
    const newType = typeParam;

    // Update state from URL - use functional updates to compare and only update if changed
    setSearchTerm((prev) => (prev !== newSearchTerm ? newSearchTerm : prev));
    setDebouncedSearchTerm((prev) =>
      prev !== newSearchTerm ? newSearchTerm : prev
    );
    setLocation((prev) => (prev !== newLocation ? newLocation : prev));
    setType((prev) => (prev !== newType ? newType : prev));
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
    const currentLocation = searchParams.get("location") || "";
    const currentType = searchParams.get("type") || "";

    // Get state values - use debouncedSearchTerm for search, immediate updates for others
    const stateSearch = debouncedSearchTerm.trim();
    const stateLocation = location.trim();
    const stateType = type.trim();

    // Compare values to see if URL needs updating
    const searchChanged = currentSearch !== stateSearch;
    const locationChanged = currentLocation !== stateLocation;
    const typeChanged = currentType !== stateType;

    // Only update URL if values actually differ
    if (!searchChanged && !locationChanged && !typeChanged) {
      return;
    }

    // Build new params
    const params = new URLSearchParams();

    // Update search
    if (stateSearch) {
      params.set("search", stateSearch);
    }

    // Update location
    if (stateLocation) {
      params.set("location", stateLocation);
    }

    // Update type
    if (stateType) {
      params.set("type", stateType);
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
  }, [debouncedSearchTerm, location, type, pathname, router, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSecondaryWidgets(true);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const normalizedSearchTerm = debouncedSearchTerm.trim();

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
    type.trim() ? [type.trim()] : [],
    [],
    location.trim(),
    undefined,
    undefined
  );

  const searchPlaceholders = [
    "Software Engineer Intern",
    "Data Science Intern",
    "Marketing Intern",
  ];

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
  const allInternships = (data?.pages?.flatMap((page) => page.internships) || []).filter(Boolean);

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
    _internshipId: string,
    _isBookmarked: boolean
  ) => {
    // TODO: handle bookmark
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setLocation("");
    setType("");
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
          {/* Search Bar with Filter Icon */}
          <div className="relative mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder={searchPlaceholders[currentPlaceholderIndex]}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pr-10 pl-10 text-sm sm:h-10 sm:text-base"
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
              className={`h-8 shrink-0 cursor-pointer px-2 hover:bg-orange-600 hover:text-white sm:h-10 ${isFilterBoxOpen ? "bg-orange-500 text-white hover:bg-orange-600" : ""}`}
            >
              <Filter className={`size-4`} />
            </Button>
          </div>

          {/* Filter Box */}
          {isFilterBoxOpen && (
            <div className="mt-2 rounded-lg border bg-white p-3 sm:p-4">
              {/* Internship Type Filter */}
              <div className="mb-3 sm:mb-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm">
                  Internship Type
                </label>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    setType(value === type ? "" : value)
                  }
                >
                  <SelectTrigger className="h-7 w-full cursor-pointer text-xs sm:h-8 sm:text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="mb-3 sm:mb-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm">
                  Location
                </label>
                <div className="relative">
                  <Input
                    placeholder="Location (e.g., Delhi, Mumbai)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-8 pr-8 text-xs sm:h-9 sm:pr-10 sm:text-sm"
                  />
                  {location && (
                    <button
                      type="button"
                      onClick={() => setLocation("")}
                      className="absolute top-1/2 right-2.5 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 sm:right-3 sm:h-4 sm:w-4"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Clear Filters Button */}
              <Button
                onClick={clearFilters}
                variant="outline"
                className="h-7 w-full text-xs sm:h-8 sm:text-sm"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        {/* Desktop: 3-Column Layout */}
        <div className="hidden gap-6 lg:grid lg:grid-cols-12">
          {/* Left Sidebar - 3 columns */}
          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              {/* Search Bar - Above Quick Links */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder={searchPlaceholders[currentPlaceholderIndex]}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pr-10 pl-10 text-sm sm:h-10 sm:text-base"
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
                  className={`h-8 shrink-0 cursor-pointer px-2 hover:bg-orange-600 hover:text-white sm:h-10 ${isFilterBoxOpen ? "bg-orange-500 text-white hover:bg-orange-600" : ""}`}
                >
                  <Filter className={`size-4`} />
                </Button>
              </div>

              {/* Filters */}
              {isFilterBoxOpen && (
                <div className="rounded-lg border bg-white px-4 py-3">
                  <h3 className="mb-3 font-semibold text-gray-900">
                    Filters
                  </h3>
                  <div className="space-y-4">
                    {/* Internship Type Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Internship Type
                      </label>
                      <Select
                        value={type}
                        onValueChange={(value) =>
                          setType(value === type ? "" : value)
                        }
                      >
                        <SelectTrigger className="h-8 w-full cursor-pointer text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="onsite">Onsite</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Location (e.g., Delhi, Mumbai)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-9 pr-10 text-sm"
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
                    </div>

                    {/* Clear Filters Button */}
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="h-8 w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="rounded-lg border bg-white px-4 py-3">
                <h3 className="mb-3 font-semibold text-gray-900">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/opportunities"
                    prefetch={false}
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    Opportunities
                  </Link>
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

              {/* featured */}
              <FeaturedOpportunities />
            </div>
          </aside>

          {/* Main Content - 6 columns */}
          <main className="col-span-6 max-h-[90vh] overflow-y-scroll pr-2 hide-scrollbar">
            <ToolkitBanner />

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
                          {index === Math.max(0, allInternships.length - 3) && (
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
            </div>
          </aside>
        </div>

        {/* Mobile Content (single column) */}
        <div className="lg:hidden">
          <Dialog
            open={isNewInternshipOpen}
            onOpenChange={setIsNewInternshipOpen}
          >
            <DialogContent
              className="mx-auto p-4 md:max-h-[600px] md:min-w-[600px]"
              overlayClassName="backdrop-blur-xs bg-black/30"
            >
              <DialogHeader>
                <DialogTitle>Post New Internship</DialogTitle>
              </DialogHeader>
              {/* TODO: Add InternshipForm component */}
              <div>Internship form coming soon</div>
            </DialogContent>
          </Dialog>

          <ToolkitBanner />

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
                        You&apos;ve reached the end of internships
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
