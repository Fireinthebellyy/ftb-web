"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import UngatekeepCard from "@/components/ungatekeep/UngatekeepCard";
import CalendarWidget from "@/components/opportunity/CalendarWidget";
import FeaturedToolkits from "@/components/toolkit/FeaturedToolkits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type UngatekeepPost = {
  id: string;
  title: string;
  content: string;
  images: string[];
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkImage?: string | null;
  tag?: "announcement" | "company_experience" | "resources" | null;
  isPinned: boolean;
  publishedAt?: string | null;
  createdAt: string;
  creatorName?: string | null;
};

type UngatekeepResponse = {
  posts: UngatekeepPost[];
  totalCount: number;
  isLimited: boolean;
};

export default function UngatekeepPage() {
  const { data, isLoading } = useQuery<UngatekeepResponse>({
    queryKey: ["ungatekeep"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/ungatekeep");
        return response.data;
      } catch (error) {
        console.error("Error fetching ungatekeep posts:", error);
        toast.error("Failed to load posts. Please try again later.");
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const posts = data?.posts ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasMorePosts = data?.isLimited ?? false;
  const hiddenCount = totalCount - posts.length;

  if (isLoading) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto max-w-7xl py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content skeleton */}
            <div className="flex-1">
              <div className="mb-8">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              {[...Array(3)].map((_, index) => (
                <div key={index} className="mb-4">
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ))}
            </div>
            {/* Sidebar skeleton */}
            <div className="w-full lg:w-80 space-y-4">
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
      <div className="container mx-auto max-w-7xl py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Ungatekeep
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Value-adding posts and announcements from the team
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-lg border bg-white py-12 text-center">
                <h3 className="mb-2 text-lg font-semibold text-gray-600">
                  No posts yet
                </h3>
                <p className="text-gray-500">
                  Check back soon for updates and announcements!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <UngatekeepCard key={post.id} post={post} />
                ))}

                {hasMorePosts ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 pointer-events-none" />
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white/80 backdrop-blur-sm py-8 text-center">
                      <Lock className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                      <h3 className="mb-2 text-lg font-semibold text-gray-700">
                        {hiddenCount} more {hiddenCount === 1 ? "post" : "posts"} available
                      </h3>
                      <p className="text-gray-500 mb-4">
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
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
              <CalendarWidget />
              <FeaturedToolkits />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
