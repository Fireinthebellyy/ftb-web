"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter } from "lucide-react";
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
import { useFeatured, useOpportunities } from "@/lib/queries";
import Image from "next/image";
import CalendarWidget from "@/components/opportunity/CalendarWidget";

export default function OpportunityCardsPage() {
  const { data: opportunities = [], isLoading, error } = useOpportunities();

  const [isNewOpportunityOpen, setIsNewOpportunityOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const { data: featured = [] } = useFeatured(4);

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

  const filteredAndSortedOpportunities = opportunities
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
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
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
            {filteredAndSortedOpportunities.length} of {opportunities.length}{" "}
            opportunities
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
                  {opportunities.length} results
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
                    href="/bookmarks"
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
                  <div className="space-y-4">
                    {filteredAndSortedOpportunities.map((opportunity) => (
                      <OpportunityPost
                        key={opportunity.id}
                        opportunity={opportunity}
                        onBookmarkChange={handleBookmarkChange}
                      />
                    ))}
                  </div>
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
              {/* Featured Posts */}
              <div className="rounded-lg border bg-white px-4 py-3">
                <h3 className="mb-4 font-semibold text-gray-900">Featured</h3>
                {featured && featured.length > 0 ? (
                  <ul className="space-y-4">
                    {featured.map((item, index) => (
                      <li
                        key={item._id || `featured-${index}`}
                        className="flex items-start space-x-3"
                      >
                        <div
                          className={`relative h-12 w-12 rounded ${
                            !item.thumbnail
                              ? "bg-gradient-to-br from-gray-100 to-gray-200"
                              : ""
                          }`}
                        >
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail.asset.url}
                              alt={item.title}
                              className="h-12 w-12 rounded object-cover"
                              width={100}
                              height={100}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg
                                className="h-6 w-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.5"
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {item.title.length > 30
                              ? `${item.title.substring(0, 30)}...`
                              : item.title}
                          </a>
                          {item.description && (
                            <p className="mt-1 text-xs text-gray-500">
                              {item.description.length > 30
                                ? `${item.description.substring(0, 30)}...`
                                : item.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <div className="mb-2 text-4xl">🌟</div>
                    <p className="text-sm">No featured posts yet</p>
                  </div>
                )}
              </div>

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
                <div className="space-y-3 sm:space-y-4">
                  {filteredAndSortedOpportunities.map((opportunity) => (
                    <OpportunityPost
                      key={opportunity.id}
                      opportunity={opportunity}
                      onBookmarkChange={handleBookmarkChange}
                    />
                  ))}
                </div>
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
    </div>
  );
}
