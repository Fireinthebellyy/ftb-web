"use client";

import { useState, useEffect } from "react";
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
import axios from "axios";
import Link from "next/link";
import OpportunityPost from "@/components/OpportunityCard";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: string | string[];
  tags?: string[];
  created_at: string;
  start_date: string;
};

export default function OpportunityCardsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const handleBookmarkChange = (
    opportunityId: string,
    isBookmarked: boolean
  ) => {
    console.log(
      `Opportunity ${opportunityId} ${
        isBookmarked ? "bookmarked" : "unbookmarked"
      }`
    );
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/opportunities");
      const data = response.data;
      setOpportunities(data.opportunities || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      console.error("Error fetching opportunities:", err);
    } finally {
      setLoading(false);
    }
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
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "start_date":
          return (
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error loading opportunities: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Full width */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
              Discover Opportunities
            </h1>
            <p className="text-sm sm:text-lg text-gray-600 mb-4">
              Find hackathons, grants, competitions, and more.
            </p>
            <Link href="/opportunities/new">
              <Button className="w-full sm:w-auto">Post an Opportunity</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content with 3-column layout */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Mobile: Search and Filters (stays the same) */}
        <div className="bg-white border rounded-lg px-4 py-3 mb-6 lg:hidden">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                  <Filter className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[400px]">
                <SheetHeader>
                  <SheetTitle>Filter & Sort</SheetTitle>
                  <SheetDescription>
                    Customize your opportunity search
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
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
                    <label className="text-sm font-medium mb-2 block">
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
                        <SelectItem value="start_date">Start Date</SelectItem>
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
        <div className="hidden lg:grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - 3 columns */}
          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Search & Filter
                </h3>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Type</label>
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
                  <label className="text-sm font-medium mb-2 block">
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
                      <SelectItem value="start_date">Start Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-600 mb-3">
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
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/opportunities/new"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    Post Opportunity
                  </Link>
                  <Link
                    href="/bookmarks"
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    My Bookmarks
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
          <main className="col-span-6">
            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
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

            {!loading && (
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
                  <div className="text-center py-12 bg-white rounded-lg border">
                    <div className="text-gray-400 mb-4">
                      <Search className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No opportunities found
                    </h3>
                    <p className="text-gray-500 mb-4">
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
              {/* Featured Posts Placeholder */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Featured</h3>
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🌟</div>
                  <p className="text-sm">Featured posts will appear here</p>
                </div>
              </div>

              {/* Trending Tags */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Trending Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    #ai
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    #blockchain
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    #web3
                  </span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                    #startup
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Platform Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Opportunities</span>
                    <span className="font-medium">{opportunities.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active This Week</span>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Applications</span>
                    <span className="font-medium">1,234</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile Content (single column) */}
        <div className="lg:hidden">
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
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

          {!loading && (
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
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No opportunities found
                  </h3>
                  <p className="text-gray-500 mb-4">
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
