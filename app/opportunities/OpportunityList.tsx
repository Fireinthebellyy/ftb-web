"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import OpportunityPost from "@/components/OpportunityCard";
import { NewOpportunityButton } from "@/components/opportunity/NewOpportunityButton";
import FeaturedOpportunities from "@/components/opportunity/FeaturedOpportunities";
import { useInfiniteOpportunities } from "@/lib/queries";
import FeedbackWidget from "@/components/FeedbackWidget";
import CalendarWidget from "@/components/opportunity/CalendarWidget";
import TaskWidget from "@/components/opportunity/TaskWidget";

const FEATURE_FLAGS = {
  showTrendingTags: false,
};

export default function OpportunityCardsPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteOpportunities(10);

  const [isNewOpportunityOpen, setIsNewOpportunityOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Flatten all opportunities from all pages
  const allOpportunities =
    data?.pages?.flatMap((page) => page.opportunities) || [];

  // Apply filtering and sorting to the loaded opportunities
  const filteredAndSortedOpportunities = allOpportunities
    .filter((opportunity) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        opportunity.title.toLowerCase().includes(search) ||
        opportunity.description.toLowerCase().includes(search) ||
        opportunity.tags?.some((tag) => tag.toLowerCase().includes(search));

      const matchesType =
        filterType === "all"
          ? true
          : Array.isArray(opportunity.type)
            ? opportunity.type.includes(filterType)
            : opportunity.type === filterType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          // API already provides newest first, so maintain order
          return 0;
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "startDate":
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        default:
          return 0;
      }
    });

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
  }, [handleLoadMore, filteredAndSortedOpportunities.length]);

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

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setSortBy("newest");
    setIsFilterOpen(false);
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
      {/* Main Content with 3-column layout */}
      <div className="container mx-auto max-w-7xl px-4 pt-6">
        {/* Mobile: Search and Filters (stays the same) */}
        <div className="mb-4 rounded-lg border bg-white px-4 py-3 lg:hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="px-3">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[400px]">
                <SheetHeader>
                  <SheetTitle>Filter & Sort</SheetTitle>
                  <SheetDescription>
                    Customize your opportunity search
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4 px-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Filter by Type
                    </label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="hackathon">Hackathons</SelectItem>
                        <SelectItem value="grant">Grants</SelectItem>
                        <SelectItem value="competition">
                          Competitions
                        </SelectItem>
                        <SelectItem value="ideathon">Ideathons</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Sort by
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Newest First" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="title">Title A-Z</SelectItem>
                        <SelectItem value="startDate">Start Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="flex-1"
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {filteredAndSortedOpportunities.length} of {allOpportunities.length}{" "}
            opportunities loaded
          </div>
        </div>

        {/* Desktop: 3-Column Layout */}
        <div className="hidden gap-6 lg:grid lg:grid-cols-12">
          {/* Left Sidebar - 3 columns */}
          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              {/* Search and Filters */}
              <div className="rounded-lg border bg-white px-4 py-3">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Search & Filter
                </h3>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="hackathon">Hackathons</SelectItem>
                      <SelectItem value="grant">Grants</SelectItem>
                      <SelectItem value="competition">Competitions</SelectItem>
                      <SelectItem value="ideathon">Ideathons</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">
                    Sort by
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Newest First" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                      <SelectItem value="startDate">Start Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results count */}
                <div className="mb-3 text-sm text-gray-600">
                  {filteredAndSortedOpportunities.length} of{" "}
                  {allOpportunities.length} results loaded
                </div>

                {/* Clear filters button */}
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>

              {/* Additional Sidebar Content */}
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

              {/* Featured Posts */}
              <FeaturedOpportunities />
            </div>
          </aside>

          {/* Main Content - Middle Column - 6 columns */}
          <main className="col-span-6 max-h-[90vh] overflow-y-scroll pr-2">
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
                {filteredAndSortedOpportunities.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {filteredAndSortedOpportunities.map(
                        (opportunity, index) => (
                          <div key={opportunity.id}>
                            <OpportunityPost
                              opportunity={opportunity}
                              onBookmarkChange={handleBookmarkChange}
                            />
                            {/* Place trigger at 3rd card from the end, but watch the last card for 1+ items */}
                            {filteredAndSortedOpportunities.length > 1 &&
                              index ===
                                Math.max(
                                  0,
                                  filteredAndSortedOpportunities.length - 3
                                ) && (
                                <div ref={desktopTriggerRef} className="h-1" />
                              )}
                          </div>
                        )
                      )}
                    </div>

                    {/* Load more indicator - also acts as fallback trigger */}
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                      {/* Auto-fetch trigger when filtered set is empty but we still have more pages */}
                      {filteredAndSortedOpportunities.length === 0 &&
                        hasNextPage &&
                        !isFetchingNextPage && (
                          <div ref={desktopTriggerRef} className="h-1" />
                        )}
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
                )}
              </>
            )}
          </main>

          {/* Right Sidebar - Featured Posts - 3 columns */}
          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              <CalendarWidget />
              <TaskWidget />
              {FEATURE_FLAGS.showTrendingTags && (
                <>
                  {/* Trending Tags */}
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
              {FEATURE_FLAGS.showTrendingTags && (
                <>
                  {/* Trending Tags */}
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

        {/* Mobile Content (single column) */}
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
              {filteredAndSortedOpportunities.length > 0 ? (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {filteredAndSortedOpportunities.map(
                      (opportunity, index) => (
                        <div key={opportunity.id}>
                          <OpportunityPost
                            opportunity={opportunity}
                            onBookmarkChange={handleBookmarkChange}
                          />
                          {/* Place trigger at 3rd card from the end, but watch the last card for 1+ items */}
                          {filteredAndSortedOpportunities.length > 1 &&
                            index ===
                              Math.max(
                                0,
                                filteredAndSortedOpportunities.length - 3
                              ) && (
                              <div ref={mobileTriggerRef} className="h-1" />
                            )}
                        </div>
                      )
                    )}
                  </div>

                  {/* Load more indicator for mobile - also acts as fallback trigger */}
                  <div className="flex justify-center py-8">
                    {/* Auto-fetch trigger when filtered set is empty but we still have more pages */}
                    {filteredAndSortedOpportunities.length === 0 &&
                      hasNextPage &&
                      !isFetchingNextPage && (
                        <div ref={mobileTriggerRef} className="h-1" />
                      )}
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
