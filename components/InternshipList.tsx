"use client";

/* eslint-disable max-lines */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Filter, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import InternshipPost from "@/components/InternshipCard";
import { FeedbackWidget } from "@/components/FeedbackWidget";
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

interface SearchWidgetProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  filteredSuggestions: string[];
  placeholder: string;
  applyFilters: (term?: string) => void;
}

const SearchWidget = ({
  searchTerm,
  setSearchTerm,
  isSearchFocused,
  setIsSearchFocused,
  filteredSuggestions,
  placeholder,
  applyFilters,
}: SearchWidgetProps) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Reset focusedIndex when suggestions change or list closes
  useEffect(() => {
    if (!isSearchFocused || filteredSuggestions.length === 0) {
      setFocusedIndex(-1);
    } else if (focusedIndex >= filteredSuggestions.length) {
      setFocusedIndex(filteredSuggestions.length - 1);
    }
  }, [isSearchFocused, filteredSuggestions, focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchFocused || filteredSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        Math.min(prev + 1, filteredSuggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < filteredSuggestions.length) {
        e.preventDefault();
        setSearchTerm(filteredSuggestions[focusedIndex]);
        applyFilters(filteredSuggestions[focusedIndex]);
        setIsSearchFocused(false);
      }
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters();
        setIsSearchFocused(false);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsSearchFocused(false);
        }
      }}
      className="group relative flex-1"
    >
      <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-slate-400 transition-colors duration-200 group-focus-within:text-[#ec5b13]" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onKeyDown={handleKeyDown}
        className="h-12 w-full rounded-[16px] border-slate-200 bg-white pr-[4.5rem] pl-11 text-sm shadow-sm transition-all focus-visible:border-[#ec5b13] focus-visible:ring-1 focus-visible:ring-orange-500/50 [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {searchTerm && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setSearchTerm("");
              applyFilters("");
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="flex h-8 items-center justify-center rounded-[10px] bg-[#ec5b13] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#d44d0c]"
          aria-label="Submit search"
        >
          Go
        </button>
      </div>
      {isSearchFocused && filteredSuggestions.length > 0 && (
        <ul className="absolute top-[calc(100%+8px)] right-0 left-0 z-50 overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-lg">
          {filteredSuggestions.map((suggestion, idx) => (
            <li key={suggestion}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearchTerm(suggestion);
                  applyFilters(suggestion);
                  setIsSearchFocused(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:bg-slate-50",
                  idx === focusedIndex &&
                    "bg-orange-50 font-bold text-[#ec5b13]"
                )}
                tabIndex={-1}
              >
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

const normalizeLocationValue = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(",");

function InternshipCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full sm:h-11 sm:w-11" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-3 w-[45%]" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function InternshipList() {
  const searchParams = useSearchParams();

  const [isNewInternshipOpen, setIsNewInternshipOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(
    () => searchParams.get("search") || ""
  );
  const [appliedSearchTerm, setAppliedSearchTerm] = useState<string>(
    () => searchParams.get("search") || ""
  );
  const [location, setLocation] = useState<string>(
    () => searchParams.get("location") || ""
  );
  const [appliedLocation, setAppliedLocation] = useState<string>(() =>
    normalizeLocationValue(searchParams.get("location") || "")
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const raw = searchParams.get("types") || searchParams.get("type") || "";
    return raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  });
  const [appliedTypes, setAppliedTypes] = useState<string[]>(() => {
    const raw = searchParams.get("types") || searchParams.get("type") || "";
    return raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  });
  const [paidOnly, setPaidOnly] = useState<boolean>(
    () => searchParams.get("paid") === "true"
  );
  const [appliedPaidOnly, setAppliedPaidOnly] = useState<boolean>(
    () => searchParams.get("paid") === "true"
  );
  const [isFilterBoxOpen, setIsFilterBoxOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);

  const normalizedLocation = useMemo(
    () => normalizeLocationValue(location),
    [location]
  );

  const serializedSelectedTypes = selectedTypes.join(",");
  const serializedAppliedTypes = appliedTypes.join(",");
  const normalizedSearchTerm = appliedSearchTerm.trim();

  const hasAppliedFilters =
    appliedSearchTerm.trim().length > 0 ||
    appliedLocation.length > 0 ||
    appliedTypes.length > 0 ||
    appliedPaidOnly;
  const hasDraftFilters =
    searchTerm.trim().length > 0 ||
    normalizedLocation.length > 0 ||
    selectedTypes.length > 0 ||
    paidOnly;
  const hasActiveFilters = hasAppliedFilters || hasDraftFilters;
  const hasPendingChanges =
    normalizedLocation !== appliedLocation ||
    serializedSelectedTypes !== serializedAppliedTypes ||
    paidOnly !== appliedPaidOnly ||
    searchTerm.trim() !== appliedSearchTerm;

  // URL sync removed to avoid full-page reloads when interacting with filters.

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSecondaryWidgets(true);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const {
    data,
    isLoading,
    isFetching,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteInternships(
    10,
    normalizedSearchTerm,
    appliedTypes,
    [],
    appliedLocation,
    appliedPaidOnly ? 1 : undefined,
    undefined
  );

  const searchPlaceholders = useMemo(
    () => [
      "Software Engineer Intern",
      "Data Science Intern",
      "Marketing Intern",
      "Product Management Intern",
      "Design Intern",
      "Finance Intern",
    ],
    []
  );

  const searchSuggestions = useMemo(
    () => [
      "Software Engineer",
      "Data Science",
      "Product Management",
      "Marketing",
      "UI/UX Design",
      "Finance",
      "Data Analyst",
      "Machine Learning",
      "Business Analyst",
      "Human Resources",
      "Sales",
      "Remote Internships",
    ],
    []
  );

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return searchSuggestions.slice(0, 5);
    }
    const term = searchTerm.toLowerCase();
    return searchSuggestions
      .filter((s) => s.toLowerCase().includes(term))
      .slice(0, 5);
  }, [searchTerm, searchSuggestions]);

  const applyFilters = useCallback(
    (overrideSearch?: string) => {
      const nextSearch = (overrideSearch ?? searchTerm).trim();

      if (overrideSearch !== undefined) {
        setSearchTerm(overrideSearch);
      }

      setAppliedSearchTerm(nextSearch);
      setAppliedLocation(normalizedLocation);
      setAppliedTypes(selectedTypes);
      setAppliedPaidOnly(paidOnly);
    },
    [searchTerm, normalizedLocation, selectedTypes, paidOnly]
  );

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
  const showInitialSkeleton =
    (isLoading || isFetching) && allInternships.length === 0;

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
        if (entries.some((entry) => entry.isIntersecting)) {
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

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    setLocation("");
    setAppliedLocation("");
    setSelectedTypes([]);
    setAppliedTypes([]);
    setPaidOnly(false);
    setAppliedPaidOnly(false);
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
          {showInitialSkeleton ? (
            <div className="mb-2 flex items-center gap-3">
              <Skeleton className="h-12 flex-1 rounded-[16px]" />
              <Skeleton className="h-12 w-12 rounded-[14px]" />
            </div>
          ) : (
            <>
              <div className="relative mb-2 flex items-center gap-3">
                <SearchWidget
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  isSearchFocused={isSearchFocused}
                  setIsSearchFocused={setIsSearchFocused}
                  filteredSuggestions={filteredSuggestions}
                  placeholder={searchPlaceholders[currentPlaceholderIndex]}
                  applyFilters={applyFilters}
                />
                <Button
                  variant="outline"
                  aria-label="Toggle filters"
                  aria-expanded={isFilterBoxOpen}
                  aria-controls="mobile-filter-panel"
                  onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
                  className={cn(
                    "h-12 w-12 shrink-0 rounded-[14px] border-none shadow-sm transition-all focus:ring-0 active:scale-95",
                    isFilterBoxOpen || hasActiveFilters
                      ? "bg-[#d44d0c] text-white hover:bg-[#b03d0a]"
                      : "bg-[#ec5b13] text-white hover:bg-[#d44d0c]"
                  )}
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </div>

              {/* Filter Box */}
              {isFilterBoxOpen && (
                <div
                  id="mobile-filter-panel"
                  className="animate-in slide-in-from-top-2 mt-4 rounded-[20px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 duration-200"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Filters
                    </h3>
                    <button
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        hasActiveFilters
                          ? "text-[#ec5b13] hover:text-[#d44d0c]"
                          : "cursor-not-allowed text-slate-300"
                      )}
                    >
                      Reset filters
                    </button>
                  </div>

                  {/* Internship Type Filter */}
                  <div className="mb-6">
                    <label className="mb-3 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                      Type
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {["onsite", "remote", "hybrid"].map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleType(t)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                            selectedTypes.includes(t)
                              ? "border-slate-300 bg-slate-50 text-slate-800"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stipend Filter */}
                  <div className="mb-6">
                    <label className="mb-3 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                      Stipend
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setPaidOnly(true)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                          paidOnly
                            ? "border-slate-300 bg-slate-50 text-slate-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => setPaidOnly(false)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                          !paidOnly
                            ? "border-slate-300 bg-slate-50 text-slate-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        Paid/Unpaid
                      </button>
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div className="mb-2">
                    <label className="mb-3 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                      Location
                    </label>
                    <div className="group relative">
                      <Input
                        placeholder="E.g. Delhi, Mumbai (comma separated)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-11 w-full rounded-[12px] border-slate-200 bg-white pr-10 pl-4 text-sm shadow-sm transition-all focus-visible:border-[#ec5b13] focus-visible:ring-1 focus-visible:ring-orange-500/50"
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

                  <Button
                    onClick={() => applyFilters()}
                    disabled={!hasPendingChanges}
                    className="mt-4 w-full"
                  >
                    Apply filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop: 3-Column Layout */}
        <div className="hidden gap-6 lg:grid lg:grid-cols-12">
          {/* Left Sidebar - 3 columns */}
          <aside className="col-span-3">
            <div className="scrollbar-hide sticky top-20 max-h-[calc(100vh-6rem)] space-y-6 overflow-y-auto pr-2 pb-12">
              {/* Search Bar */}
              {showInitialSkeleton ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 flex-1 rounded-[16px]" />
                  <Skeleton className="h-12 w-12 rounded-[14px]" />
                </div>
              ) : (
                <>
                  <div className="relative flex items-center gap-3">
                    <SearchWidget
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      isSearchFocused={isSearchFocused}
                      setIsSearchFocused={setIsSearchFocused}
                      filteredSuggestions={filteredSuggestions}
                      placeholder={searchPlaceholders[currentPlaceholderIndex]}
                      applyFilters={applyFilters}
                    />
                    <Button
                      variant="outline"
                      aria-label="Toggle filters"
                      aria-expanded={isFilterBoxOpen}
                      aria-controls="desktop-filter-panel"
                      onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
                      className={cn(
                        "h-12 w-12 shrink-0 rounded-[14px] border-none shadow-sm transition-all focus:ring-0 active:scale-95",
                        isFilterBoxOpen || hasActiveFilters
                          ? "bg-[#d44d0c] text-white hover:bg-[#b03d0a]"
                          : "bg-[#ec5b13] text-white hover:bg-[#d44d0c]"
                      )}
                    >
                      <Filter className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              )}

              {/* Filters */}
              {!showInitialSkeleton && isFilterBoxOpen && (
                <div
                  id="desktop-filter-panel"
                  className="animate-in slide-in-from-top-2 rounded-[20px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 duration-200"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Filters
                    </h3>
                    <button
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        hasActiveFilters
                          ? "text-[#ec5b13] hover:text-[#d44d0c]"
                          : "cursor-not-allowed text-slate-300"
                      )}
                    >
                      Reset filters
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Internship Type Filter */}
                    <div>
                      <label className="mb-3 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                        Type
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {["onsite", "remote", "hybrid"].map((t) => (
                          <button
                            key={t}
                            onClick={() => toggleType(t)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                              selectedTypes.includes(t)
                                ? "border-slate-300 bg-slate-50 text-slate-800"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            )}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stipend Filter */}
                    <div>
                      <label className="mb-3 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                        Stipend
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => setPaidOnly(true)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                            paidOnly
                              ? "border-slate-300 bg-slate-50 text-slate-800"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          Paid
                        </button>
                        <button
                          onClick={() => setPaidOnly(false)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                            !paidOnly
                              ? "border-slate-300 bg-slate-50 text-slate-800"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          Paid/Unpaid
                        </button>
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="mb-3 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                        Location
                      </label>
                      <div className="group relative">
                        <Input
                          placeholder="E.g. Delhi, Mumbai (comma separated)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-11 w-full rounded-[12px] border-slate-200 bg-white pr-10 pl-4 text-sm shadow-sm transition-all focus-visible:border-[#ec5b13] focus-visible:ring-1 focus-visible:ring-orange-500/50"
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

                    <Button
                      onClick={() => applyFilters()}
                      disabled={!hasPendingChanges}
                      className="w-full"
                    >
                      Apply filters
                    </Button>
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
            {showInitialSkeleton && (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <InternshipCardSkeleton key={index} />
                ))}
              </div>
            )}

            {!showInitialSkeleton && (
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
                    <div
                      ref={loadMoreDesktopRef}
                      className="flex justify-center py-8"
                    >
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
            <div className="scrollbar-hide sticky top-20 max-h-[calc(100vh-6rem)] space-y-6 overflow-y-auto pr-2 pb-12">
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

          {showInitialSkeleton && (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <InternshipCardSkeleton key={index} />
              ))}
            </div>
          )}

          {!showInitialSkeleton && (
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
                  <div
                    ref={loadMoreMobileRef}
                    className="flex justify-center py-8"
                  >
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
