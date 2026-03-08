"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import UngatekeepCard from "@/components/ungatekeep/UngatekeepCard";
import FeaturedToolkits from "@/components/toolkit/FeaturedToolkits";
import { Button } from "@/components/ui/button";

export default function SavedUngatekeepPage() {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPosts = () => {
      const posts = JSON.parse(localStorage.getItem("ungatekeep_saved") || "[]");
      setSavedPosts(posts);
      setIsLoaded(true);
    };

    loadPosts();

    window.addEventListener("ungatekeep-post-saved", loadPosts);
    return () => window.removeEventListener("ungatekeep-post-saved", loadPosts);
  }, []);

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 pt-2 pb-4 md:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {/* Main Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-6">
              <Button
                variant="ghost"
                asChild
                className="mb-4 -ml-2 text-muted-foreground hover:text-primary"
              >
                <Link href="/ungatekeep">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Ungatekeep
                </Link>
              </Button>
              <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                Saved Posts
              </h1>
              <p className="text-sm text-gray-600 md:text-base">
                Your collection of saved ungatekeep posts
              </p>
            </div>

            {!isLoaded ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 w-full animate-pulse rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : savedPosts.length === 0 ? (
              <div className="rounded-lg border bg-white py-12 text-center">
                <Bookmark className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <h3 className="mb-2 text-lg font-semibold text-gray-600">
                  No saved posts yet
                </h3>
                <p className="mb-6 text-gray-500">
                  Save posts you find interesting to read them later!
                </p>
                <Button asChild>
                  <Link href="/ungatekeep">Explore Posts</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedPosts.map((post) => (
                  <UngatekeepCard key={post.id} post={post} />
                ))}
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
