"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import UngatekeepCard from "@/components/ungatekeep/UngatekeepCard";
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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          {[...Array(3)].map((_, index) => (
            <div key={index} className="mb-6 space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ungatekeep</h1>
          <p className="text-gray-600">
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
          <div className="space-y-6">
            {posts.map((post) => (
              <UngatekeepCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
