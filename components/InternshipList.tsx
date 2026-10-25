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
import { useSearchParams, useRouter } from "next/navigation";
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
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import FeaturedOpportunities from "./opportunity/FeaturedOpportunities";
import ToolkitBanner from "./internship/ToolkitBanner";
import { internshipFields } from "./internship/constants";
import { SimilarInternships } from "./internship/SimilarInternships";
import InternshipTrackerButton from "./internship/InternshipTrackerButton";

const CalendarWidget = dynamic(() => import("./opportunity/CalendarWidget"));
const TaskWidget = dynamic(() => import("./opportunity/TaskWidget"));

interface SearchWidgetProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  filteredSuggestions: string[];
  placeholder: string;
  applyFilters: (term?: string, specificFields?: string[]) => void;
  selectedFields: string[];
}

const SearchWidget = ({
  searchTerm,
  setSearchTerm,
  isSearchFocused,
  setIsSearchFocused,
  filteredSuggestions,
  placeholder,
  applyFilters,
  selectedFields,
}: SearchWidgetProps) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [activeBubble, setActiveBubble] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Reset focusedIndex when suggestions change or list closes
  useEffect(() => {
    if (!isSearchFocused || filteredSuggestions.length === 0) {
      setFocusedIndex(-1);
    } else if (focusedIndex >= filteredSuggestions.length) {
      setFocusedIndex(filteredSuggestions.length - 1);
    }
  }, [isSearchFocused, filteredSuggestions, focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsSearchFocused(false);
      inputRef.current?.blur();
      return;
    }
    if (!isSearchFocused || filteredSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredSuggestions.length) {
        applyFilters(filteredSuggestions[focusedIndex]);
        setIsSearchFocused(false);
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters(searchTerm);
        setIsSearchFocused(false);
      }}
      className="relative w-full"
    >
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => {
            if (!isSearchFocused) {
              setIsSearchFocused(true);
            }
            inputRef.current?.focus();
          }}
          className="absolute left-3 z-10 flex h-5 w-5 cursor-pointer items-center justify-center text-gray-400 transition-colors hover:text-slate-700"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-8 pl-10 text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-300 focus:outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setActiveBubble(null);
              applyFilters("", []);
              inputRef.current?.focus();
            }}
            className="absolute right-3 z-10 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isSearchFocused && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsSearchFocused(false)}
          />
          <div
            className={cn(
              "animate-in fade-in slide-in-from-top-2 absolute top-[calc(100%+8px)] left-0 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 duration-200",
              "right-[-3rem]"
            )}
          >
            {/* Header */}
            <div className="border-b border-slate-100 bg-white px-4 py-3.5">
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-bold text-slate-900">
                  Explore popular fields
                </p>
                <p className="text-[11px] text-slate-500">
                  Choose one, then search
                </p>
              </div>
            </div>
            {/* Field boxes */}
            <div className="scrollbar-none grid max-h-[10rem] grid-cols-2 gap-2.5 overflow-y-auto bg-white p-4 lg:max-h-[12.5rem]">
              {internshipFields.map((field, idx) => {
                const isSelected = activeBubble?.id === field.id;
                return (
                  <button
                    type="button"
                    key={`${field.id}-${idx}`}
                    className={cn(
                      "flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border px-2.5 py-2 text-center text-[11px] font-bold whitespace-normal transition-all duration-200 ease-out active:scale-[0.98] lg:text-xs",
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200/80 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveBubble(
                        isSelected ? null : { id: field.id, label: field.label }
                      );
                    }}
                  >
                    <span className="w-full text-center leading-snug">
                      {field.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* search button */}
            <div className="border-t border-slate-100 bg-white px-4 py-3">
              <button
                type="button"
                className={cn(
                  "h-10 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]",
                  activeBubble
                    ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
                    : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                )}
                onClick={() => {
                  if (activeBubble && activeBubble?.label) {
                    setSearchTerm(activeBubble.label);
                    applyFilters(activeBubble.label, [activeBubble.id]);
                    setActiveBubble(null);
                    setIsSearchFocused(false);
                  } else {
                    applyFilters(searchTerm, selectedFields);
                    setIsSearchFocused(false);
                  }
                }}
              >
                Search Internships
              </button>
            </div>
          </div>
        </>
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

const parseFiniteNumberFromSearchParam = (
  valueStr: string | null
): number | undefined => {
  if (valueStr === null || valueStr === "") return undefined;
  const value = Number(valueStr);
  return Number.isFinite(value) ? value : undefined;
};

export default function InternshipList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isNewInternshipOpen, setIsNewInternshipOpen] = useState(false);

  const initialSearch = searchParams.get("search") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialPaidOnly = searchParams.get("paid") === "true";
  const initialMinStipend = parseFiniteNumberFromSearchParam(
    searchParams.get("min_stipend")
  );
  const initialStipendFilter = initialPaidOnly
    ? "paid"
    : initialMinStipend !== undefined
      ? "custom"
      : "all";
  const initialType = searchParams.get("type")
    ? searchParams.get("type")!.split(",")
    : [];
  const initialTags = searchParams.get("tags")
    ? searchParams.get("tags")!.split(",")
    : [];

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [location, setLocation] = useState(initialLocation);
  const [stipendFilter, setStipendFilter] = useState<"all" | "paid" | "custom">(
    initialStipendFilter
  );
  const [minStipend, setMinStipend] = useState<number>(
    initialMinStipend ?? 10000
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialType);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  const initialFields = searchParams.get("fields")
    ? searchParams.get("fields")!.split(",")
    : [];
  const [selectedFields, setSelectedFields] = useState<string[]>(initialFields);

  const [appliedSearchTerm, setAppliedSearchTerm] = useState(initialSearch);
  const [appliedLocation, setAppliedLocation] = useState(initialLocation);
  const [appliedStipendFilter, setAppliedStipendFilter] = useState<
    "all" | "paid" | "custom"
  >(initialStipendFilter);
  const [appliedMinStipend, setAppliedMinStipend] = useState<
    number | undefined
  >(initialMinStipend);
  const [appliedTypes, setAppliedTypes] = useState<string[]>(initialType);
  const [appliedTags, setAppliedTags] = useState<string[]>(initialTags);
  const [appliedFields, setAppliedFields] = useState<string[]>(initialFields);

  const [activeTab, setActiveTab] = useState<
    "type" | "stipend" | "location" | "fields"
  >("type");

  const [lastInteracted, setLastInteracted] = useState<{
    id: string;
    field: string | null;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("last_interacted_internship");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            setLastInteracted(parsed);
          } else {
            setLastInteracted(null);
          }
        } catch (e) {
          console.error("Failed to parse last interacted internship", e);
          setLastInteracted(null);
        }
      } else {
        setLastInteracted(null);
      }
    }
  }, []);

  useEffect(() => {
    const updatedSearch = searchParams.get("search") || "";
    const updatedLocation = searchParams.get("location") || "";
    const updatedPaidOnly = searchParams.get("paid") === "true";
    const updatedMinStipend = parseFiniteNumberFromSearchParam(
      searchParams.get("min_stipend")
    );
    const updatedStipendFilter = updatedPaidOnly
      ? "paid"
      : updatedMinStipend !== undefined
        ? "custom"
        : "all";
    const updatedType = searchParams.get("type")
      ? searchParams.get("type")!.split(",")
      : [];
    const updatedTags = searchParams.get("tags")
      ? searchParams.get("tags")!.split(",")
      : [];
    const updatedFields = searchParams.get("fields")
      ? searchParams.get("fields")!.split(",")
      : [];

    let initialSearchTermVal = updatedSearch;
    if (!updatedSearch && updatedFields.length > 0) {
      const fieldItem = internshipFields.find((f) => f.id === updatedFields[0]);
      if (fieldItem) {
        initialSearchTermVal = fieldItem.label;
      }
    }

    setSearchTerm(initialSearchTermVal);
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
    setSelectedFields(updatedFields);
    setAppliedFields(updatedFields);
  }, [searchParams]);
  const [isFilterBoxOpen, setIsFilterBoxOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);
  // const [showAllFields, setShowAllFields] = useState(false);

  // const fieldsList = useMemo(() => {
  //   return internshipFields.map((f) => ({ value: f.id, label: f.label }));
  // }, []);

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
    appliedFields.length > 0 ||
    appliedStipendFilter !== "all" ||
    appliedMinStipend !== undefined;
  const hasDraftFilters =
    searchTerm.trim().length > 0 ||
    normalizedLocation.length > 0 ||
    selectedTypes.length > 0 ||
    selectedTags.length > 0 ||
    selectedFields.length > 0 ||
    stipendFilter !== "all";
  const hasActiveFilters = hasAppliedFilters || hasDraftFilters;
  const hasPendingChanges =
    normalizedLocation !== appliedLocation ||
    serializedSelectedTypes !== serializedAppliedTypes ||
    selectedTags.join(",") !== appliedTags.join(",") ||
    selectedFields.join(",") !== appliedFields.join(",") ||
    stipendFilter !== appliedStipendFilter ||
    (stipendFilter === "custom" &&
      appliedStipendFilter === "custom" &&
      minStipend !== appliedMinStipend) ||
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
    appliedStipendFilter === "paid"
      ? 1
      : appliedStipendFilter === "custom"
        ? (appliedMinStipend ?? 0)
        : undefined,
    undefined,
    appliedFields
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

  const [showInternshipSkeleton, setShowInternshipSkeleton] = useState(false);
  const applyFilters = useCallback(
    (overrideSearch?: string, specificFields?: string[]) => {
      const nextSearch = (overrideSearch ?? searchTerm).trim();

      const finalFields =
        specificFields !== undefined ? specificFields : selectedFields;

      const isFieldLabel = internshipFields.some(
        (f) =>
          f.label.toLowerCase() === nextSearch.toLowerCase() &&
          finalFields.includes(f.id)
      );

      const newParams = new URLSearchParams();
      if (nextSearch && !isFieldLabel) {
        newParams.set("search", nextSearch);
      }
      if (location.trim()) {
        newParams.set("location", normalizedLocation);
      }
      if (stipendFilter === "paid") {
        newParams.set("paid", "true");
      } else if (stipendFilter === "custom") {
        newParams.set("min_stipend", minStipend.toString());
      }
      if (selectedTypes.length > 0) {
        newParams.set("type", selectedTypes.join(","));
      }
      if (selectedTags.length > 0) {
        newParams.set("tags", selectedTags.join(","));
      }
      if (finalFields.length > 0) {
        newParams.set("fields", finalFields.join(","));
      }
      if (nextSearch) {
        posthog.capture("internship_search_submitted", {
          search_term: nextSearch,
        });
      }

      // Track other filters
      if (
        location.trim() ||
        stipendFilter !== "all" ||
        selectedTypes.length > 0 ||
        selectedTags.length > 0 ||
        selectedFields.length > 0
      ) {
        posthog.capture("internship_filters_applied", {
          location: normalizedLocation,
          stipend_filter: stipendFilter,
          min_stipend: minStipend,
          types: selectedTypes,
          tags: selectedTags,
          fields: selectedFields,
        });
      }

      setShowInternshipSkeleton(true);
      setTimeout(() => {
        router.push(`?${newParams.toString()}`, { scroll: false });
        if (overrideSearch !== undefined) {
          setSearchTerm(overrideSearch);
        }
        setAppliedSearchTerm(isFieldLabel ? "" : nextSearch);
        setAppliedLocation(normalizedLocation);
        setAppliedTypes(selectedTypes);
        setAppliedStipendFilter(stipendFilter);
        setAppliedMinStipend(
          stipendFilter === "custom" ? minStipend : undefined
        );
        setAppliedTags(selectedTags);
        setAppliedFields(finalFields);
        if (specificFields !== undefined) {
          setSelectedFields(specificFields);
        }
        setShowInternshipSkeleton(false);
      }, 1000);
    },
    [
      searchTerm,
      normalizedLocation,
      selectedTypes,
      selectedTags,
      selectedFields,
      stipendFilter,
      minStipend,
      location,
      router,
    ]
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

  // Flatten and deduplicate all internships from all pages by ID to prevent duplicate React key warnings
  const rawInternships = (
    data?.pages?.flatMap((page) => page.internships) || []
  ).filter(Boolean);
  const seenIds = new Set<string>();
  const seenOtherDetails = new Set<string>();
  const allInternships = rawInternships.filter((internship) => {
    const otherDetails = `${internship.title},${internship.hiringOrganization},${internship.description}`;
    if (seenIds.has(internship.id) || seenOtherDetails.has(otherDetails)) {
      return false;
    }
    seenIds.add(internship.id);
    seenOtherDetails.add(otherDetails);
    return true;
  });

  // Restore scroll position when returning to the internship list page
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      allInternships.length > 0 &&
      !isLoading
    ) {
      const clickedId = sessionStorage.getItem("last_clicked_internship_id");
      const scrollPos = sessionStorage.getItem("internship_list_scroll_pos");
      const timeouts: ReturnType<typeof setTimeout>[] = [];

      if (clickedId) {
        let attempts = 0;
        const maxAttempts = 20; // Try for up to 1 second
        const isMobile = window.innerWidth < 1024;
        const prefix = isMobile ? "mobile-" : "desktop-";

        const tryScroll = () => {
          const element = document.getElementById(
            `${prefix}internship-card-${clickedId}`
          );
          if (element) {
            element.scrollIntoView({ block: "center" });
            sessionStorage.removeItem("last_clicked_internship_id");
            sessionStorage.removeItem("internship_list_scroll_pos");
          } else if (attempts < maxAttempts) {
            attempts++;
            const t = setTimeout(tryScroll, 50);
            timeouts.push(t);
          } else {
            if (scrollPos) {
              const y = parseInt(scrollPos, 10);
              if (!isNaN(y)) {
                window.scrollTo(0, y);
              }
            }
            sessionStorage.removeItem("last_clicked_internship_id");
            sessionStorage.removeItem("internship_list_scroll_pos");
          }
        };
        const timer = setTimeout(tryScroll, 50);
        timeouts.push(timer);
      } else if (scrollPos) {
        const y = parseInt(scrollPos, 10);
        if (!isNaN(y)) {
          const timer = setTimeout(() => {
            window.scrollTo(0, y);
            sessionStorage.removeItem("internship_list_scroll_pos");
          }, 50);
          timeouts.push(timer);
        }
      }

      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
  }, [allInternships.length, isLoading]);

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

  // const toggleField = (value: string) => {
  //   setSelectedFields((prev) =>
  //     prev.includes(value)
  //       ? prev.filter((item) => item !== value)
  //       : [...prev, value]
  //   );
  // };

  // const toggleTag = (value: string) => {
  //   setSelectedTags((prev) =>
  //     prev.includes(value)
  //       ? prev.filter((item) => item !== value)
  //       : [...prev, value]
  //     );
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
    setSelectedFields([]);
    setAppliedFields([]);
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
      <div className="container mx-auto max-w-7xl px-4 pt-2 lg:pt-3">
        {/* Mobile: Search */}

        <div
          className={cn("mb-0 lg:hidden", isSearchFocused && "relative z-50")}
        >
          {showInitialSkeleton ? (
            <div className="mb-2 flex w-full items-center justify-between py-1">
              <Skeleton className="h-10 w-[calc(100%-96px)] rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "relative mb-2 flex w-full items-center justify-between py-1",
                  isSearchFocused && "z-50"
                )}
              >
                <div
                  className={cn(
                    "relative transition-all duration-300 ease-in-out",
                    isSearchFocused
                      ? "z-50 w-[calc(100%-48px)]"
                      : "z-20 w-[calc(100%-96px)]"
                  )}
                >
                  <SearchWidget
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    isSearchFocused={isSearchFocused}
                    setIsSearchFocused={setIsSearchFocused}
                    filteredSuggestions={filteredSuggestions}
                    placeholder={searchPlaceholders[currentPlaceholderIndex]}
                    applyFilters={applyFilters}
                    selectedFields={selectedFields}
                  />
                </div>

                <div
                  className={cn(
                    "absolute right-12 z-10 transition-all duration-300 ease-in-out",
                    isSearchFocused
                      ? "pointer-events-none scale-95 opacity-0"
                      : "pointer-events-auto scale-100 opacity-100"
                  )}
                >
                  <InternshipTrackerButton
                    tabIndex={isSearchFocused ? -1 : 0}
                  />
                </div>

                <Button
                  aria-label="Toggle filters"
                  aria-expanded={isMobileFilterOpen}
                  aria-controls="mobile-filter-panel"
                  onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                  className={cn(
                    "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white transition-all focus:ring-0 active:scale-95",
                    isMobileFilterOpen || hasActiveFilters
                      ? "bg-orange-700 hover:bg-orange-800"
                      : "bg-orange-600 hover:bg-orange-700"
                  )}
                >
                  <Filter className="h-5 w-5 text-white" />
                </Button>
              </div>

              {/* Bottom-to-Top Filter Drawer */}
              <Drawer
                open={isMobileFilterOpen}
                onOpenChange={setIsMobileFilterOpen}
              >
                <DrawerContent className="flex h-[48vh] max-h-[55vh] flex-col overflow-hidden rounded-t-3xl bg-white p-0 pb-0">
                  {/* Header */}
                  <div className="flex shrink-0 flex-row items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex flex-col">
                      <DrawerTitle className="text-lg font-bold text-slate-900">
                        Filters
                      </DrawerTitle>
                      <DrawerDescription className="sr-only">
                        Filter internships by field, location, stipend, and tags
                      </DrawerDescription>
                      {hasAppliedFilters && (
                        <span className="mt-0.5 text-[10px] font-medium text-orange-600">
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
                        "flex items-center justify-center rounded-xl border p-2 transition-all active:scale-95",
                        hasActiveFilters
                          ? "border-orange-200 bg-orange-50 text-[#ec5b13] hover:border-orange-300 hover:bg-orange-100"
                          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      )}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Two-pane layout body */}
                  <div className="flex min-h-0 flex-grow overflow-hidden">
                    {/* Left Pane (Tabs sidebar) */}
                    <div className="flex w-[125px] shrink-0 flex-col overflow-y-auto border-r border-slate-100 bg-slate-50">
                      {(
                        [
                          {
                            id: "type",
                            label: "Type",
                            active: selectedTypes.length > 0,
                          },
                          {
                            id: "stipend",
                            label: "Stipend",
                            active: stipendFilter !== "all",
                          },
                          {
                            id: "location",
                            label: "Location",
                            active: location.trim().length > 0,
                          },
                          // { id: "fields", label: "Fields", active: selectedFields.length > 0 },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "relative flex items-center justify-between border-b border-slate-100/50 px-4 py-4 text-left text-[13px] font-bold tracking-wide transition-all",
                            activeTab === tab.id
                              ? "border-l-4 border-[#ec5b13] bg-white text-[#ec5b13] shadow-sm"
                              : "border-l-4 border-transparent text-black hover:bg-slate-100/70"
                          )}
                        >
                          <span>{tab.label}</span>
                          {tab.active && (
                            <span className="ml-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ec5b13]" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Right Pane (Options container) */}
                    <div className="flex-1 overflow-y-auto bg-white p-4">
                      {/* TYPE options */}
                      {activeTab === "type" && (
                        <div className="space-y-1">
                          <span className="mb-2 block px-1 text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                            Internship Type
                          </span>
                          {["onsite", "remote", "hybrid"].map((t) => {
                            const isSelected = selectedTypes.includes(t);
                            return (
                              <button
                                key={t}
                                onClick={() => toggleType(t)}
                                className="flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]"
                              >
                                <div
                                  className={cn(
                                    "mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                    isSelected
                                      ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                      : "border-slate-300 bg-white"
                                  )}
                                >
                                  {isSelected && (
                                    <svg
                                      className="h-2.5 w-2.5 fill-none stroke-white stroke-[3]"
                                      viewBox="0 0 24 24"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "text-[13px] text-black capitalize",
                                    isSelected ? "font-bold" : "font-normal"
                                  )}
                                >
                                  {t}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* STIPEND options */}
                      {activeTab === "stipend" && (
                        <div className="space-y-3">
                          <span className="mb-1 block px-1 text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                            Stipend Option
                          </span>
                          {(
                            [
                              { value: "all", label: "Paid/Unpaid (All)" },
                              { value: "paid", label: "Paid Only" },
                            ] as const
                          ).map((option) => {
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
                                className="flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]"
                              >
                                <div
                                  className={cn(
                                    "mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                    isSelected
                                      ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                      : "border-slate-300 bg-white"
                                  )}
                                >
                                  {isSelected && (
                                    <svg
                                      className="h-2.5 w-2.5 fill-none stroke-white stroke-[3]"
                                      viewBox="0 0 24 24"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "text-[13px] text-black",
                                    isSelected ? "font-bold" : "font-normal"
                                  )}
                                >
                                  {option.label}
                                </span>
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
                          <span className="block px-1 text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                            Filter by Location
                          </span>
                          <span className="mb-1 block px-1 text-[11px] text-slate-600">
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

                      {/* FIELDS options */}
                      {/* {activeTab === "fields" && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-2 px-1">
                            Fields
                          </span>
                          {fieldsList.map((field) => {
                            const isSelected = selectedFields.includes(field.value);
                            return (
                              <button
                                key={field.value}
                                onClick={() => toggleField(field.value)}
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
                                )}>{field.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )} */}
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex shrink-0 items-center border-t border-slate-100 bg-white px-6 py-4">
                    <Button
                      onClick={() => {
                        applyFilters();
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full rounded-xl py-3 text-sm font-bold active:scale-95"
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
          <aside
            className={cn("col-span-3", isSearchFocused && "relative z-50")}
          >
            <div className="scrollbar-hide sticky top-20 max-h-[calc(100vh-6rem)] space-y-6 overflow-y-auto pt-1.5 pr-2 pb-12">
              {/* Search Bar */}
              {showInitialSkeleton ? (
                <div className="flex w-full items-center justify-between py-1">
                  <Skeleton className="h-10 w-[calc(100%-96px)] rounded-lg" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "relative flex w-full items-center justify-between py-1",
                      isSearchFocused && "z-50"
                    )}
                  >
                    <div
                      className={cn(
                        "relative transition-all duration-300 ease-in-out",
                        isSearchFocused
                          ? "z-50 w-[calc(100%-48px)]"
                          : "z-20 w-[calc(100%-96px)]"
                      )}
                    >
                      <SearchWidget
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isSearchFocused={isSearchFocused}
                        setIsSearchFocused={setIsSearchFocused}
                        filteredSuggestions={filteredSuggestions}
                        placeholder={
                          searchPlaceholders[currentPlaceholderIndex]
                        }
                        applyFilters={applyFilters}
                        selectedFields={selectedFields}
                      />
                    </div>

                    <div
                      className={cn(
                        "absolute right-12 z-10 transition-all duration-300 ease-in-out",
                        isSearchFocused
                          ? "pointer-events-none scale-95 opacity-0"
                          : "pointer-events-auto scale-100 opacity-100"
                      )}
                    >
                      <InternshipTrackerButton
                        tabIndex={isSearchFocused ? -1 : 0}
                      />
                    </div>

                    <Button
                      aria-label="Toggle filters"
                      aria-expanded={isFilterBoxOpen}
                      aria-controls="desktop-filter-panel"
                      onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-all focus:ring-0 active:scale-95",
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
                        "flex items-center justify-center rounded-xl border p-2 transition-all active:scale-95",
                        hasActiveFilters
                          ? "border-orange-200 bg-orange-50 text-[#ec5b13] hover:border-orange-300 hover:bg-orange-100"
                          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
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
                              className="flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]"
                            >
                              <div
                                className={cn(
                                  "mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                  isSelected
                                    ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                    : "border-slate-300 bg-white"
                                )}
                              >
                                {isSelected && (
                                  <svg
                                    className="h-2.5 w-2.5 fill-none stroke-white stroke-[3]"
                                    viewBox="0 0 24 24"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-[13px] text-black capitalize",
                                  isSelected ? "font-bold" : "font-normal"
                                )}
                              >
                                {t}
                              </span>
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
                        {(
                          [
                            { value: "all", label: "Paid/Unpaid (All)" },
                            { value: "paid", label: "Paid Only" },
                          ] as const
                        ).map((option) => {
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
                              className="flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]"
                            >
                              <div
                                className={cn(
                                  "mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                  isSelected
                                    ? "border-[#ec5b13] bg-[#ec5b13] text-white"
                                    : "border-slate-300 bg-white"
                                )}
                              >
                                {isSelected && (
                                  <svg
                                    className="h-2.5 w-2.5 fill-none stroke-white stroke-[3]"
                                    viewBox="0 0 24 24"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-[13px] text-black",
                                  isSelected ? "font-bold" : "font-normal"
                                )}
                              >
                                {option.label}
                              </span>
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
                      <span className="mb-2 block px-1 text-[11px] text-slate-600">
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

                    {/* Fields Filter */}
                    {/* 
                    <div>
                      <label className="mb-2 block text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                        Fields
                      </label>
                      <div className="space-y-1">
                        {(showAllFields ? fieldsList : fieldsList.slice(0, 4)).map((field) => {
                          const isSelected = selectedFields.includes(field.value);
                          return (
                            <button
                              key={field.value}
                              onClick={() => toggleField(field.value)}
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
                              )}>{field.label}</span>
                            </button>
                          );
                        })}
                        {fieldsList.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setShowAllFields(!showAllFields)}
                            className="text-[12px] font-bold text-[#ec5b13] hover:underline px-2 mt-1.5 flex items-center gap-1 transition-colors"
                          >
                            {showAllFields ? "Hide" : "See More"}
                          </button>
                        )}
                      </div>
                    </div>
                    */}

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
            {showInternshipSkeleton && (
              <>
                <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm duration-200">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#ec5b13]" />
                    <p className="animate-pulse text-sm font-semibold tracking-tight text-slate-700">
                      Finding the best internships for you...
                    </p>
                  </div>
                </div>
              </>
            )}

            {!showInitialSkeleton && (
              <>
                {allInternships.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {allInternships.map((internship, idx) => (
                        <div
                          key={`${internship.title}-${internship.id}-${idx}`}
                          id={`desktop-internship-card-${internship.id}`}
                        >
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
                  {lastInteracted && lastInteracted.id && (
                    <SimilarInternships
                      currentId={lastInteracted.id}
                      field={
                        selectedFields.length > 0
                          ? selectedFields[0]
                          : lastInteracted.field
                      }
                      title={
                        selectedFields.length > 0 ? "" : lastInteracted.title
                      }
                      layout="vertical"
                    />
                  )}
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
          {showInternshipSkeleton && (
            <>
              <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm duration-200">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#ec5b13]" />
                  <p className="animate-pulse text-sm font-semibold tracking-tight text-slate-700">
                    Finding the best internships for you...
                  </p>
                </div>
              </div>
            </>
          )}

          {!showInitialSkeleton && (
            <>
              {allInternships.length > 0 ? (
                <>
                  <div className="scrollbar-thin max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2 sm:max-h-[60vh] sm:space-y-4">
                    {allInternships.map((internship) => (
                      <div
                        key={internship.id}
                        id={`mobile-internship-card-${internship.id}`}
                      >
                        <InternshipPost
                          internship={internship}
                          onBookmarkChange={handleBookmarkChange}
                        />
                      </div>
                    ))}

                    {/* Load more trigger and indicator for mobile */}
                    <div
                      ref={loadMoreMobileRef}
                      className="animate-in fade-in flex justify-center py-6"
                    >
                      {isFetchingNextPage && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading more...</span>
                        </div>
                      )}
                      {!hasNextPage && allInternships.length > 0 && (
                        <div className="text-xs font-semibold tracking-tight text-gray-400">
                          You&apos;ve reached the end
                        </div>
                      )}
                    </div>
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

          {lastInteracted && lastInteracted.id && (
            <SimilarInternships
              currentId={lastInteracted.id}
              field={
                selectedFields.length > 0
                  ? selectedFields[0]
                  : lastInteracted.field
              }
              title={selectedFields.length > 0 ? "" : lastInteracted.title}
              layout="vertical"
            />
          )}
        </div>
      </div>
      <div className="hidden lg:block">
        <FeedbackWidget />
      </div>
    </div>
  );
}
