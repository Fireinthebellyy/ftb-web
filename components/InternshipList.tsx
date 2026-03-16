"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const getInitialPaidOnly = () => searchParams.get("paid") === "true";

  const [isNewInternshipOpen, setIsNewInternshipOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(getInitialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>(getInitialSearch);
  const [location, setLocation] = useState<string>(getInitialLocation);
  const [type, setType] = useState<string>(getInitialType);
  const [paidOnly, setPaidOnly] = useState<boolean>(getInitialPaidOnly);
  const [isFilterBoxOpen, setIsFilterBoxOpen] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);

  // 1. We ONLY update the URL when the debounced search term, location, or type changes.
  // We do NOT listen to `searchParams` to update the local state after mount, 
  // as this causes bidirectional recursive updates (glitchy behavior).
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    if (debouncedSearchTerm !== (params.get("search") || "")) {
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
      else params.delete("search");
      hasChanges = true;
    }

    if (location !== (params.get("location") || "")) {
      if (location) params.set("location", location);
      else params.delete("location");
      hasChanges = true;
    }

    if (type !== (params.get("type") || "")) {
      if (type) params.set("type", type);
      else params.delete("type");
      hasChanges = true;
    }

    if (paidOnly !== (params.get("paid") === "true")) {
      if (paidOnly) params.set("paid", "true");
      else params.delete("paid");
      hasChanges = true;
    }

    if (hasChanges) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearchTerm, location, type, paidOnly, pathname, router, searchParams]);

  // Debounce search term updates (400ms delay) - only for user input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    paidOnly ? 1 : undefined,
    undefined
  );

  const searchPlaceholders = useMemo(() => [
    "Software Engineer Intern",
    "Data Science Intern",
    "Marketing Intern",
  ], []);

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
  const allInternships = (
    data?.pages?.flatMap((page) => page.internships) || []
  ).filter(Boolean);

  // Intersection observer for infinite scroll
  const loadMoreDesktopRef = useRef<HTMLDivElement>(null);
  const loadMoreMobileRef = useRef<HTMLDivElement>(null);

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
        threshold: 0,
        rootMargin: "200px",
      }
    );

    const desktopRef = loadMoreDesktopRef.current;
    const mobileRef = loadMoreMobileRef.current;

    if (hasNextPage) {
      if (desktopRef) observer.observe(desktopRef);
      if (mobileRef) observer.observe(mobileRef);
    }

    return () => {
      if (desktopRef) observer.unobserve(desktopRef);
      if (mobileRef) observer.unobserve(mobileRef);
    };
  }, [handleLoadMore, hasNextPage]);

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
    setPaidOnly(false);
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
      <div className="container mx-auto max-w-7xl px-4 pt-0 lg:pt-2">
        {/* Mobile: Search */}

        <div className="mb-0 lg:hidden">
          <div className="relative mb-2 flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-slate-400 group-focus-within:text-[#ec5b13] transition-colors duration-200" />
              <Input
                placeholder={searchPlaceholders[currentPlaceholderIndex]}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full pl-11 pr-10 rounded-[16px] border-slate-200 bg-white text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-[#ec5b13] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                  className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              aria-label="Toggle filters"
              aria-expanded={isFilterBoxOpen}
              aria-controls="mobile-filter-panel"
              onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
              className={cn(
                "h-12 w-12 shrink-0 rounded-[14px] border-none shadow-sm transition-all focus:ring-0 active:scale-95",
                isFilterBoxOpen || location || type || paidOnly
                  ? "bg-[#d44d0c] text-white hover:bg-[#b03d0a]"
                  : "bg-[#ec5b13] text-white hover:bg-[#d44d0c]"
              )}
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          {/* Filter Box */}
          {isFilterBoxOpen && (
            <div id="mobile-filter-panel" className="mt-4 rounded-[20px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-900 text-lg">Filters</h3>
                {(location || type || paidOnly) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-[#ec5b13] hover:text-[#d44d0c] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Internship Type Filter */}
              <div className="mb-6">
                <label className="mb-3 block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Type
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {["onsite", "remote", "hybrid"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(type === t ? "" : t)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                        type === t
                          ? "bg-slate-50 border-slate-300 text-slate-800"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stipend Filter */}
              <div className="mb-6">
                <label className="mb-3 block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Stipend
                </label>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setPaidOnly(!paidOnly)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                      paidOnly
                        ? "bg-slate-50 border-slate-300 text-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    Paid Only
                  </button>
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-2">
                <label className="mb-3 block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Location
                </label>
                <div className="relative group">
                  <Input
                    placeholder="E.g. Delhi, Mumbai"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 w-full pl-4 pr-10 rounded-[12px] border-slate-200 bg-white text-sm focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-[#ec5b13] transition-all shadow-sm"
                  />
                  {location && (
                    <button
                      type="button"
                      aria-label="Clear location"
                      onClick={() => setLocation("")}
                      className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: 3-Column Layout */}
        <div className="hidden gap-6 lg:grid lg:grid-cols-12">
          {/* Left Sidebar - 3 columns */}
          <aside className="col-span-3">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 scrollbar-hide space-y-6 pb-12">
              {/* Search Bar */}
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-slate-400 group-focus-within:text-[#ec5b13] transition-colors duration-200" />
                  <Input
                    placeholder={searchPlaceholders[currentPlaceholderIndex]}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 w-full pl-11 pr-10 rounded-[16px] border-slate-200 bg-white text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-[#ec5b13] transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearchTerm("")}
                      className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  aria-label="Toggle filters"
                  aria-expanded={isFilterBoxOpen}
                  aria-controls="desktop-filter-panel"
                  onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
                  className={cn(
                    "h-12 w-12 shrink-0 rounded-[14px] border-none shadow-sm transition-all focus:ring-0 active:scale-95",
                    isFilterBoxOpen || location || type || paidOnly
                      ? "bg-[#d44d0c] text-white hover:bg-[#b03d0a]"
                      : "bg-[#ec5b13] text-white hover:bg-[#d44d0c]"
                  )}
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </div>

              {/* Filters */}
              {isFilterBoxOpen && (
                <div id="desktop-filter-panel" className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-900 text-lg">Filters</h3>
                    {(location || type || paidOnly) && (
                      <button
                        onClick={clearFilters}
                        className="text-sm font-medium text-[#ec5b13] hover:text-[#d44d0c] transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {/* Internship Type Filter */}
                    <div>
                      <label className="mb-3 block text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Type
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {["onsite", "remote", "hybrid"].map((t) => (
                          <button
                            key={t}
                            onClick={() => setType(type === t ? "" : t)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                              type === t
                                ? "bg-slate-50 border-slate-300 text-slate-800"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stipend Filter */}
                    <div>
                      <label className="mb-3 block text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Stipend
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => setPaidOnly(!paidOnly)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                            paidOnly
                              ? "bg-slate-50 border-slate-300 text-slate-800"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          Paid Only
                        </button>
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="mb-3 block text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Location
                      </label>
                      <div className="relative group">
                        <Input
                          placeholder="E.g. Delhi, Mumbai"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-11 w-full pl-4 pr-10 rounded-[12px] border-slate-200 bg-white text-sm focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-[#ec5b13] transition-all shadow-sm"
                        />
                        {location && (
                          <button
                            type="button"
                            aria-label="Clear location"
                            onClick={() => setLocation("")}
                            className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* featured */}
              <FeaturedOpportunities />
            </div>
          </aside>

          {/* Main Content - 6 columns */}
          <main className="col-span-6 pr-2">
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
                      {allInternships.map((internship) => (
                        <div key={internship.id}>
                          <InternshipPost
                            internship={internship}
                            onBookmarkChange={handleBookmarkChange}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Load more trigger and indicator */}
                    <div ref={loadMoreDesktopRef} className="flex justify-center py-8">
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
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 scrollbar-hide space-y-6 pb-12">
              {showSecondaryWidgets ? (
                <>
                  <CalendarWidget kind="internship" />
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
                    {allInternships.map((internship) => (
                      <div key={internship.id}>
                        <InternshipPost
                          internship={internship}
                          onBookmarkChange={handleBookmarkChange}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Load more trigger and indicator for mobile */}
                  <div ref={loadMoreMobileRef} className="flex justify-center py-8">
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
      <div className="hidden lg:block">
        <FeedbackWidget />
      </div>
    </div>
  );
}
