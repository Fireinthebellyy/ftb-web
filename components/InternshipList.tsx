"use client";

/* eslint-disable max-lines */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Filter, Loader2, RotateCcw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams,useRouter } from "next/navigation";
import InternshipPost from "@/components/InternshipCard";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { useInfiniteInternships } from "@/lib/queries-internships";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
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
        className="h-10 w-full rounded-lg border-slate-200 bg-white pr-[4.5rem] pl-11 text-sm shadow-sm transition-all focus-visible:border-[#ec5b13] focus-visible:ring-1 focus-visible:ring-orange-500/50 [&::-webkit-search-cancel-button]:hidden"
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
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="flex h-7 items-center justify-center rounded-md bg-[#ec5b13] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#d44d0c]"
          aria-label="Submit search"
        >
          Go
        </button>
      </div>
      {isSearchFocused && filteredSuggestions.length > 0 && (
        <ul className="absolute top-[calc(100%+8px)] right-0 left-0 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
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

// const LINKED_CATEGORIES: Record<string, string[]> = {
//   "software engineering": ["data science", "product management"],
//   "data science": ["software engineering", "product management"],
//   "design": ["product management", "marketing"],
//   "marketing": ["product management", "design"],
//   "product management": ["design", "marketing", "software engineering"],
//   "finance": ["product management", "human resources"],
//   "human resources": ["marketing", "finance"],
// };


export default function InternshipList() {
  const searchParams = useSearchParams();
  const router= useRouter();
  const [isNewInternshipOpen, setIsNewInternshipOpen] = useState(false);

  const initialSearch=searchParams.get("search")||"";
  const initialLocation=searchParams.get("location")||"";
  const initialPaidOnly=searchParams.get("paid")==="true";
  const initialMinStipend=searchParams.get("min_stipend") ? Number(searchParams.get("min_stipend")) : undefined;
  const initialStipendFilter = initialPaidOnly ? "paid" : (initialMinStipend !== undefined ? "custom" : "all");
  const initialType=searchParams.get("type")?searchParams.get("type")!.split(","):[];
  const initialTags=searchParams.get("tags")?searchParams.get("tags")!.split(","):[];

  const [searchTerm,setSearchTerm]=useState(initialSearch);
  const [location,setLocation]=useState(initialLocation);
  const [stipendFilter,setStipendFilter]=useState<"all" | "paid" | "custom">(initialStipendFilter);
  const [minStipend,setMinStipend]=useState<number>(initialMinStipend ?? 10000);
  const [selectedTypes,setSelectedTypes]=useState<string[]>(initialType);
  const [selectedTags,setSelectedTags]=useState<string[]>(initialTags);

  const [appliedSearchTerm,setAppliedSearchTerm]=useState(initialSearch);
  const [appliedLocation,setAppliedLocation]=useState(initialLocation);
  const [appliedStipendFilter,setAppliedStipendFilter]=useState<"all" | "paid" | "custom">(initialStipendFilter);
  const [appliedMinStipend,setAppliedMinStipend]=useState<number | undefined>(initialMinStipend);
  const [appliedTypes,setAppliedTypes]=useState<string[]>(initialType);
  const [appliedTags,setAppliedTags]=useState<string[]>(initialTags);

  const [activeTab, setActiveTab] = useState<"type" | "stipend" | "location" | "category">("type");

  useEffect(()=>{
    const updatedSearch=searchParams.get("search")||"";
    const updatedLocation=searchParams.get("location")||"";
    const updatedPaidOnly=searchParams.get("paid")==="true";
    const updatedMinStipend=searchParams.get("min_stipend") ? Number(searchParams.get("min_stipend")) : undefined;
    const updatedStipendFilter = updatedPaidOnly ? "paid" : (updatedMinStipend !== undefined ? "custom" : "all");
    const updatedType=searchParams.get("type")?searchParams.get("type")!.split(","):[];
    const updatedTags=searchParams.get("tags")?searchParams.get("tags")!.split(","):[];

    setSearchTerm(updatedSearch);
    setAppliedSearchTerm(updatedSearch);
    setLocation(updatedLocation);
    setAppliedLocation(updatedLocation);
    setStipendFilter(updatedStipendFilter);
    setMinStipend(updatedMinStipend ?? 10000);
    setAppliedStipendFilter(updatedStipendFilter);
    setAppliedMinStipend(updatedMinStipend);
    setSelectedTypes(updatedType);
    setAppliedTypes(updatedType);
    setSelectedTags(updatedTags);
    setAppliedTags(updatedTags);
  },[searchParams])
  const [isFilterBoxOpen, setIsFilterBoxOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);
  // const [showAllCategories, setShowAllCategories] = useState(false);

  // const { data: dbTags = [] } = useInternshipTags();

  // const categories = useMemo(() => {
  //   if (!dbTags || dbTags.length === 0) {
  //     return [
  //       { value: "software engineering", label: "Software Engineering" },
  //       { value: "data science", label: "Data Science / AI" },
  //       { value: "design", label: "Design / UI/UX" },
  //       { value: "marketing", label: "Marketing" },
  //       { value: "product management", label: "Product Management" },
  //       { value: "finance", label: "Finance / Consulting" },
  //       { value: "human resources", label: "Human Resources" },
  //     ];
  //   }
  //   return dbTags.map((tag) => ({
  //     value: tag.toLowerCase(),
  //     label: tag.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  //   }));
  // }, [dbTags]);

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
    appliedTags.length > 0 ||
    appliedStipendFilter !== "all" ||
    appliedMinStipend !== undefined;
  const hasDraftFilters =
    searchTerm.trim().length > 0 ||
    normalizedLocation.length > 0 ||
    selectedTypes.length > 0 ||
    selectedTags.length > 0 ||
    stipendFilter !== "all";
  const hasActiveFilters = hasAppliedFilters || hasDraftFilters;
  const hasPendingChanges =
    normalizedLocation !== appliedLocation ||
    serializedSelectedTypes !== serializedAppliedTypes ||
    selectedTags.join(",") !== appliedTags.join(",") ||
    stipendFilter !== appliedStipendFilter ||
    (stipendFilter === "custom" && appliedStipendFilter === "custom" && minStipend !== appliedMinStipend) ||
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
    appliedTags,
    appliedLocation,
    appliedStipendFilter === "paid" ? 1 : (appliedStipendFilter === "custom" ? (appliedMinStipend ?? 0) : undefined),
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

  const [showInternshipSkeleton,setShowInternshipSkeleton]=useState(false);
  const applyFilters = useCallback(
    (overrideSearch?: string) => {
      const nextSearch = (overrideSearch ?? searchTerm).trim();

      const newParams=new URLSearchParams();
      if(nextSearch){
        newParams.set("search",nextSearch);
      }
      if(location.trim()){
        newParams.set("location",normalizedLocation);
      }
      if(stipendFilter === "paid"){
        newParams.set("paid","true");
      } else if(stipendFilter === "custom"){
        newParams.set("min_stipend",minStipend.toString());
      }
      if(selectedTypes.length>0){
        newParams.set("type",selectedTypes.join(","));
      }
      if(selectedTags.length>0){
        newParams.set("tags",selectedTags.join(","));
      }
      if (nextSearch) {
        posthog.capture("internship_search_submitted", {
          search_term: nextSearch,
        });
      }

      // Track other filters
      if (location.trim() || stipendFilter !== "all" || selectedTypes.length > 0 || selectedTags.length > 0) {
        posthog.capture("internship_filters_applied", {
          location: normalizedLocation,
          stipend_filter: stipendFilter,
          min_stipend: minStipend,
          types: selectedTypes,
          tags: selectedTags,
        });
      }

      setShowInternshipSkeleton(true);
      setTimeout(()=>{
        router.push(`?${newParams.toString()}`,{scroll:false})
      if (overrideSearch !== undefined) {
        setSearchTerm(overrideSearch);
      }
      setAppliedSearchTerm(nextSearch);
      setAppliedLocation(normalizedLocation);
      setAppliedTypes(selectedTypes);
      setAppliedStipendFilter(stipendFilter);
      setAppliedMinStipend(stipendFilter === "custom" ? minStipend : undefined);
      setAppliedTags(selectedTags);
      setShowInternshipSkeleton(false);
      },1000)
    },
    [searchTerm, normalizedLocation, selectedTypes, selectedTags, stipendFilter, minStipend, location, router]
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

  // const primaryTagForSimilar = appliedTags.length === 1 ? appliedTags[0] : null;
  // const linkedTags = useMemo(() => {
  //   if (!primaryTagForSimilar) return [];
  //   return LINKED_CATEGORIES[primaryTagForSimilar.toLowerCase()] || [];
  // }, [primaryTagForSimilar]);
  // 
  // const {
  //   data: similarData,
  // } = useInfiniteInternships(
  //   10,
  //   undefined,
  //   [],
  //   linkedTags,
  //   undefined,
  //   undefined,
  //   undefined
  // );
  // 
  // const similarInternships = useMemo(() => {
  //   const raw = similarData?.pages?.flatMap((page) => page.internships) || [];
  //   return raw
  //     .filter(Boolean)
  //     .filter((opp) => !allInternships.some((p) => p.id === opp.id))
  //     .slice(0, 3);
  // }, [similarData, allInternships]);

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

  // const toggleTag = (value: string) => {
  //   setSelectedTags((prev) =>
  //     prev.includes(value)
  //       ? prev.filter((item) => item !== value)
  //       : [...prev, value]
  //   );
  // };

  const clearFilters = () => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    setLocation("");
    setAppliedLocation("");
    setSelectedTypes([]);
    setAppliedTypes([]);
    setStipendFilter("all");
    setMinStipend(10000);
    setAppliedStipendFilter("all");
    setAppliedMinStipend(undefined);
    setSelectedTags([]);
    setAppliedTags([]);
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
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
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
                  aria-label="Toggle filters"
                  aria-expanded={isMobileFilterOpen}
                  aria-controls="mobile-filter-panel"
                  onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                  className={cn(
                    "h-10 w-10 flex items-center justify-center shrink-0 cursor-pointer rounded-lg text-white transition-all focus:ring-0 active:scale-95",
                    isMobileFilterOpen || hasActiveFilters
                      ? "bg-orange-700 hover:bg-orange-800"
                      : "bg-orange-600 hover:bg-orange-700"
                  )}
                >
                  <Filter className="h-5 w-5 text-white" />
                </Button>
              </div>

              {/* Bottom-to-Top Filter Drawer */}
              <Drawer open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                <DrawerContent className="p-0 pb-0 flex flex-col h-[48vh] max-h-[55vh] rounded-t-3xl overflow-hidden bg-white">
                  
                  {/* Header */}
                  <div className="px-6 py-4 flex flex-row items-center justify-between border-b border-slate-100 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-slate-900">Filters</span>
                      {hasAppliedFilters && (
                        <span className="text-[10px] text-orange-600 font-medium mt-0.5">
                          Active filters applied
                        </span>
                      )}
                    </div>
                    <button
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      title="Reset filters"
                      aria-label="Reset filters"
                      className={cn(
                        "p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center border",
                        hasActiveFilters
                          ? "border-orange-200 text-[#ec5b13] bg-orange-50 hover:bg-orange-100 hover:border-orange-300"
                          : "cursor-not-allowed text-slate-300 border-slate-100 bg-slate-50"
                      )}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Two-pane layout body */}
                  <div className="flex-grow flex overflow-hidden min-h-0">
                    
                    {/* Left Pane (Tabs sidebar) */}
                    <div className="w-[125px] shrink-0 border-r border-slate-100 bg-slate-50 flex flex-col overflow-y-auto">
                      {([
                        { id: "type", label: "Type", active: selectedTypes.length > 0 },
                        { id: "stipend", label: "Stipend", active: stipendFilter !== "all" },
                        { id: "location", label: "Location", active: location.trim().length > 0 },
                        // { id: "category", label: "Category", active: selectedTags.length > 0 },
                      ] as const).map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "py-4 px-4 text-[13px] font-bold tracking-wide transition-all text-left relative flex items-center justify-between border-b border-slate-100/50",
                            activeTab === tab.id
                              ? "bg-white text-[#ec5b13] border-l-4 border-[#ec5b13] shadow-sm"
                              : "text-black border-l-4 border-transparent hover:bg-slate-100/70"
                          )}
                        >
                          <span>{tab.label}</span>
                          {tab.active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ec5b13] shrink-0 ml-1.5" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Right Pane (Options container) */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white">
                      
                      {/* TYPE options */}
                      {activeTab === "type" && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-2 px-1">
                            Internship Type
                          </span>
                          {["onsite", "remote", "hybrid"].map((t) => {
                            const isSelected = selectedTypes.includes(t);
                            return (
                              <button
                                key={t}
                                onClick={() => toggleType(t)}
                                className="w-full flex items-center py-1.5 px-2 rounded-lg transition-colors hover:bg-slate-50 text-left active:scale-[0.99]"
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center transition-all mr-2.5 shrink-0",
                                  isSelected
                                    ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                    : "border-slate-300 bg-white"
                                )}>
                                  {isSelected && (
                                    <svg className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-[13px] capitalize text-black",
                                  isSelected ? "font-bold" : "font-normal"
                                )}>{t}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* STIPEND options */}
                      {activeTab === "stipend" && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1 px-1">
                            Stipend Option
                          </span>
                          {([
                            { value: "all", label: "Paid/Unpaid (All)" },
                            { value: "paid", label: "Paid Only" },
                          ] as const).map((option) => {
                            const isSelected = stipendFilter === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setStipendFilter(option.value);
                                  if (option.value === "all") {
                                    setMinStipend(0);
                                  } else {
                                    setMinStipend(1);
                                  }
                                }}
                                className="w-full flex items-center py-1.5 px-2 rounded-lg transition-colors hover:bg-slate-50 text-left active:scale-[0.99]"
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center transition-all mr-2.5 shrink-0",
                                  isSelected
                                    ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                    : "border-slate-300 bg-white"
                                )}>
                                  {isSelected && (
                                    <svg className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-[13px] text-black",
                                  isSelected ? "font-bold" : "font-normal"
                                )}>{option.label}</span>
                              </button>
                            );
                          })}

                          {/* <div className="pt-2 px-2 pb-1 space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                              <span>Amount Range</span>
                              <span className="text-[#ec5b13] font-extrabold">₹{minStipend.toLocaleString()}/mo</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50000"
                              step="2000"
                              value={minStipend}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setMinStipend(val);
                                setStipendFilter("custom");
                              }}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#ec5b13] outline-none"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                              <span>₹0</span>
                              <span>₹50,000+</span>
                            </div>
                          </div> */}
                        </div>
                      )}

                      {/* LOCATION option */}
                      {activeTab === "location" && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block px-1">
                            Filter by Location
                          </span>
                          <span className="text-[11px] text-slate-600 block px-1 mb-1">
                            E.g. Delhi, Mumbai (comma separated)
                          </span>
                          <div className="group relative">
                            <Input
                              placeholder="Search locations..."
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="h-10 w-full rounded-lg border-slate-200 bg-white pr-10 pl-3.5 text-[13px] shadow-sm transition-all focus-visible:border-[#ec5b13] focus-visible:ring-1 focus-visible:ring-orange-500/50"
                            />
                            {location && (
                              <button
                                type="button"
                                aria-label="Clear location"
                                onClick={() => setLocation("")}
                                className="absolute top-1/2 right-3 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CATEGORY options */}
                      {/* {activeTab === "category" && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-2 px-1">
                            Domain Category
                          </span>
                          {categories.map((cat) => {
                            const isSelected = selectedTags.includes(cat.value);
                            return (
                              <button
                                key={cat.value}
                                onClick={() => toggleTag(cat.value)}
                                className="w-full flex items-center py-1.5 px-2 rounded-lg transition-colors hover:bg-slate-50 text-left active:scale-[0.99]"
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center transition-all mr-2.5 shrink-0",
                                  isSelected
                                    ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                    : "border-slate-300 bg-white"
                                )}>
                                  {isSelected && (
                                    <svg className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-[13px] text-black",
                                  isSelected ? "font-bold" : "font-normal"
                                )}>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )} */}

                    </div>

                  </div>

                  {/* Bottom Action Bar */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex items-center">
                    <Button
                      onClick={() => {
                        applyFilters();
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full py-3 text-sm font-bold active:scale-95 rounded-xl"
                    >
                      Apply Filters
                    </Button>
                  </div>

                </DrawerContent>
              </Drawer>
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
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
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
                      aria-label="Toggle filters"
                      aria-expanded={isFilterBoxOpen}
                      aria-controls="desktop-filter-panel"
                      onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
                      className={cn(
                        "h-10 w-10 flex items-center justify-center shrink-0 rounded-lg text-white transition-all focus:ring-0 active:scale-95",
                        isFilterBoxOpen || hasActiveFilters
                          ? "bg-orange-700 hover:bg-orange-800"
                          : "bg-orange-600 hover:bg-orange-700"
                      )}
                    >
                      <Filter className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                </>
              )}

              {/* Filters */}
              {!showInitialSkeleton && isFilterBoxOpen && (
                <div
                  id="desktop-filter-panel"
                  className="animate-in slide-in-from-top-2 rounded-[20px] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/40 duration-200"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">
                      Filters
                    </h3>
                    <button
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      title="Reset filters"
                      aria-label="Reset filters"
                      className={cn(
                        "p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center border",
                        hasActiveFilters
                          ? "border-orange-200 text-[#ec5b13] bg-orange-50 hover:bg-orange-100 hover:border-orange-300"
                          : "cursor-not-allowed text-slate-300 border-slate-100 bg-slate-50"
                      )}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Internship Type Filter */}
                    <div>
                      <label className="mb-2 block text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                        Type
                      </label>
                      <div className="space-y-1">
                        {["onsite", "remote", "hybrid"].map((t) => {
                          const isSelected = selectedTypes.includes(t);
                          return (
                            <button
                              key={t}
                              onClick={() => toggleType(t)}
                              className="w-full flex items-center py-1.5 px-2 rounded-lg transition-colors hover:bg-slate-50 text-left active:scale-[0.99]"
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all mr-2.5 shrink-0",
                                isSelected
                                  ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                  : "border-slate-300 bg-white"
                              )}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span className={cn(
                                "text-[13px] capitalize text-black",
                                isSelected ? "font-bold" : "font-normal"
                              )}>{t}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stipend Filter */}
                    <div>
                      <label className="mb-2 block text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                        Stipend
                      </label>
                      <div className="space-y-3">
                        {([
                          { value: "all", label: "Paid/Unpaid (All)" },
                          { value: "paid", label: "Paid Only" },
                        ] as const).map((option) => {
                          const isSelected = stipendFilter === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                  setStipendFilter(option.value);
                                  if (option.value === "all") {
                                    setMinStipend(0);
                                  } else {
                                    setMinStipend(1);
                                  }
                              }}
                              className="w-full flex items-center py-1.5 px-2 rounded-lg transition-colors hover:bg-slate-50 text-left active:scale-[0.99]"
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all mr-2.5 shrink-0",
                                isSelected
                                  ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                  : "border-slate-300 bg-white"
                              )}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span className={cn(
                                "text-[13px] text-black",
                                isSelected ? "font-bold" : "font-normal"
                              )}>{option.label}</span>
                            </button>
                          );
                        })}

                        {/* <div className="pt-2 px-2 pb-1 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span>Amount Range</span>
                            <span className="text-[#ec5b13] font-extrabold">₹{minStipend.toLocaleString()}/mo</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50000"
                            step="2000"
                            value={minStipend}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setMinStipend(val);
                              setStipendFilter("custom");
                            }}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#ec5b13] outline-none"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                            <span>₹0</span>
                            <span>₹50,000+</span>
                          </div>
                        </div> */}
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="mb-1.5 block text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                        Location
                      </label>
                      <span className="text-[11px] text-slate-600 block mb-2 px-1">
                        E.g. Delhi, Mumbai (comma separated)
                      </span>
                      <div className="group relative">
                        <Input
                          placeholder="Search locations..."
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-10 w-full rounded-lg border-slate-200 bg-white pr-10 pl-3.5 text-[13px] shadow-sm transition-all focus-visible:border-[#ec5b13] focus-visible:ring-1 focus-visible:ring-orange-500/50"
                        />
                        {location && (
                          <button
                            type="button"
                            aria-label="Clear location"
                            onClick={() => setLocation("")}
                            className="absolute top-1/2 right-3 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter */}
                    {/* <div>
                      <label className="mb-2 block text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                        Category
                      </label>
                      <div className="space-y-1">
                        {(showAllCategories ? categories : categories.slice(0, 4)).map((cat) => {
                          const isSelected = selectedTags.includes(cat.value);
                          return (
                            <button
                              key={cat.value}
                              onClick={() => toggleTag(cat.value)}
                              className="w-full flex items-center py-1.5 px-2 rounded-lg transition-colors hover:bg-slate-50 text-left active:scale-[0.99]"
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all mr-2.5 shrink-0",
                                isSelected
                                  ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                  : "border-slate-300 bg-white"
                              )}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span className={cn(
                                "text-[13px] text-black",
                                isSelected ? "font-bold" : "font-normal"
                              )}>{cat.label}</span>
                            </button>
                          );
                        })}
                        {categories.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setShowAllCategories(!showAllCategories)}
                            className="text-[12px] font-bold text-[#ec5b13] hover:underline px-2 mt-1.5 flex items-center gap-1 transition-colors"
                          >
                            {showAllCategories ? "Hide" : "See More"}
                          </button>
                        )}
                      </div>
                    </div> */}

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

            {/* Loader when filter is applied or internship is searched */}
            {showInternshipSkeleton && <>
               <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
                   <div className="flex flex-col items-center gap-4">
                     <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#ec5b13]" />
                     <p className="text-sm font-semibold text-slate-700 animate-pulse tracking-tight">
                       Finding the best internships for you...
                       </p>
                   </div>
               </div> 
               </>
             }

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

                {/* Similar Internships Panel (Desktop) */}
                {/* {appliedTags.length === 1 && similarInternships.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                        Similar Internships You Might Like
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {similarInternships.map((internship) => (
                        <div key={internship.id} className="transition-all hover:scale-[1.01] duration-200">
                          <InternshipPost
                            internship={internship}
                            onBookmarkChange={handleBookmarkChange}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}
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

          {/* Loader when filter is applied or internship is searched */}
          {showInternshipSkeleton && <>
               <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
                   <div className="flex flex-col items-center gap-4">
                     <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#ec5b13]" />
                     <p className="text-sm font-semibold text-slate-700 animate-pulse tracking-tight">
                       Finding the best internships for you...
                       </p>
                   </div>
               </div> 
               </>
             }


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

              {/* Similar Internships Panel (Mobile) */}
              {/* {appliedTags.length === 1 && similarInternships.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">
                      Similar Internships You Might Like
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {similarInternships.map((internship) => (
                      <div key={internship.id} className="transition-all hover:scale-[1.01] duration-200">
                        <InternshipPost
                          internship={internship}
                          onBookmarkChange={handleBookmarkChange}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
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
