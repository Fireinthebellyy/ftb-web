"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Lock, Bookmark, Loader2, Pin } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useInView } from "react-intersection-observer";
import PageBannerCarousel from "@/components/banner/PageBannerCarousel";
import FeaturedToolkits from "@/components/toolkit/FeaturedToolkits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UngatekeepCard from "@/components/ungatekeep/UngatekeepCard";
import { stripHtml } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { motion, useAnimation } from "framer-motion";

type UngatekeepPost = {
  id: string;
  content: string;
  attachments: string[];
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkImage?: string | null;
  tag?: "announcement" | "company_experience" | "resources" | "playbooks" | "college_hacks" | "interview" | "ama_drops" | "ftb_recommends" | null;
  isPinned: boolean;
  isSaved?: boolean;
  publishedAt?: string | null;
  createdAt: string;
  creatorName?: string | null;
};

type UngatekeepResponse = {
  posts: UngatekeepPost[];
  totalCount: number;
  isLimited: boolean;
  hasMore: boolean;
};

export default function UngatekeepPage() {
  const { data: session } = useSession();
  const { ref, inView } = useInView();
  const savedButtonControls = useAnimation();
  const { data: savedCountData } = useQuery({
    queryKey: ["ungatekeep-saved-count", session?.user?.id],
    queryFn: async () => {
      const response = await axios.get("/api/ungatekeep/bookmarks/count");
      return response.data.count as number;
    },
    enabled: !!session?.user, // Only run if authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  const savedCount = savedCountData ?? 0;

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<UngatekeepResponse>({
    queryKey: ["ungatekeep", session?.user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await axios.get(`/api/ungatekeep?page=${pageParam}&limit=10`);
        return response.data;
      } catch (error) {
        console.error("Error fetching ungatekeep posts:", error);
        toast.error("Failed to load posts. Please try again later.");
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Refetch when session changes (login/logout) to ensure correct permissions/isSaved status
  useEffect(() => {
    refetch();
  }, [session?.user?.id, refetch]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  const pinnedPosts = posts.filter(post => post.isPinned);
  const firstPage = data?.pages[0];

  const scrollToPost = (id: string) => {
    const element = document.getElementById(`post-${id}`);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: "smooth"
      });
    }
  };

  const totalCount = firstPage?.totalCount ?? 0;
  const isLimited = firstPage?.isLimited ?? false;
  const hiddenCount = totalCount - posts.length;

  if (isLoading) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 pt-2 pb-4 md:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            {/* Main content skeleton */}
            <div className="flex-1">
              <div className="mb-8">
                <Skeleton className="mb-2 h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              {[...Array(3)].map((_, index) => (
                <div key={index} className="mb-4">
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ))}
            </div>
            {/* Sidebar skeleton */}
            <div className="w-full space-y-4 lg:w-80">
              <Skeleton className="h-80 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 pt-2 pb-4 md:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {/* Main Content */}
          <div className="min-w-0 flex-1">
            <PageBannerCarousel
              placement="ungatekeep"
              className="w-full mb-4 lg:mb-6"
            />
            <div className="flex items-start justify-between">
              <div>
                <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                  Ungatekeep
                </h1>
                <p className="text-sm text-gray-600 md:text-base mb-3">
                  Posting everything students usually figure out too late.
                </p>
              </div>
              <motion.div animate={savedButtonControls}>
                <Link
                  href="/ungatekeep/saved"
                  aria-label="View saved posts"
                  className="group relative flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-primary active:scale-95"
                >
                  <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 transition-colors group-hover:fill-primary group-hover:text-primary" />
                  {savedCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                      {savedCount}
                    </span>
                  )}
                </Link>
              </motion.div>
            </div>

            {/* Pinned Posts Quick Access */}
            {pinnedPosts.length > 0 && (
              <div className="z-30 mb-2 space-y-2 lg:mb-4">
                {pinnedPosts.map((post) => (
                  <motion.button
                    key={`pin-${post.id}`}
                    type="button"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => scrollToPost(post.id)}
                    className="w-full cursor-pointer rounded-lg border border-yellow-200 bg-yellow-50/95 p-2 text-left shadow-sm backdrop-blur-md transition-all hover:bg-yellow-100/95 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <Pin className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <p className="line-clamp-2 flex-1 text-[11px] font-medium text-yellow-800 leading-tight">
                        {stripHtml(post.content)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-lg border bg-white py-12 text-center">
                <h3 className="mb-2 text-lg font-semibold text-red-600">
                  Failed to load posts
                </h3>
                <p className="mb-6 text-gray-500">
                  {error?.message || "An unknown error occurred."}
                </p>
                <Button onClick={() => refetch()}>Retry</Button>
              </div>
            )}

            {!isLoading && !isError && posts.length === 0 ? (
              <div className="rounded-lg border bg-white py-12 text-center">
                <h3 className="mb-2 text-lg font-semibold text-gray-600">
                  No posts yet
                </h3>
                <p className="text-gray-500">
                  Check back soon for updates and announcements!
                </p>
              </div>
            ) : (
              <div className="w-full space-y-2 lg:space-y-4">
                {posts.map((post) => (
                  <UngatekeepCard key={post.id} post={post} />
                ))}

                {hasNextPage && (
                  <div ref={ref} className="flex justify-center py-4">
                    {isFetchingNextPage && (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                  </div>
                )}

                {isLimited ? (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-gray-50" />
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white/80 py-8 text-center backdrop-blur-sm">
                      <Lock className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                      <h3 className="mb-2 text-lg font-semibold text-gray-700">
                        {hiddenCount} more{" "}
                        {hiddenCount === 1 ? "post" : "posts"} available
                      </h3>
                      <p className="mb-4 text-gray-500">
                        Login to see all posts and announcements
                      </p>
                      <Button asChild>
                        <Link href="/login?returnUrl=/ungatekeep">
                          Login to continue
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="space-y-4 lg:sticky lg:top-20">
              <FeaturedToolkits />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
