"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import UngatekeepCard from "@/components/ungatekeep/UngatekeepCard";
import CalendarWidget from "@/components/opportunity/CalendarWidget";
import FeaturedToolkits from "@/components/toolkit/FeaturedToolkits";
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

export default function UngatekeepPage() {
  const { data: posts = [], isLoading } = useQuery<UngatekeepPost[]>({
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
