"use client";
 
import React, { useEffect } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { ArrowLeft, Bookmark } from "lucide-react";
import UngatekeepCard from "@/components/ungatekeep/UngatekeepCard";
import FeaturedToolkits from "@/components/toolkit/FeaturedToolkits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import PageBannerCarousel from "@/components/banner/PageBannerCarousel";
import FeaturedOpportunities from "@/components/opportunity/FeaturedOpportunities";
import { FeedbackWidget } from "@/components/FeedbackWidget";

export default function SavedUngatekeepPage() {
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  const { data: savedPosts = [], isLoading, error, refetch } = useQuery({
    queryKey: ["ungatekeep-saved"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/ungatekeep/bookmark");
        // Add isSaved: true to all returned posts since they are bookmarks
        return response.data.map((post: any) => ({ ...post, isSaved: true }));
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          throw err;
        }
        throw err;
      }
    }
  });

  useEffect(() => {
    if (error && !axios.isAxiosError(error)) {
      toast.error("Failed to load saved posts");
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 pt-2 pb-4 md:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
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
    <div className="h-full grow bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 pt-2">
        <div className="hidden gap-6 lg:grid lg:grid-cols-12">
          {/* Left Sidebar */}
          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <Link
                    href={`https://wa.me/916377492042?text=${encodeURIComponent(
                      "Hey, I would like to connect with you!"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      posthog.capture("quick_link_clicked", {
                        link_name: "Connect with us",
                      })
                    }
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    Connect with us
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      posthog.capture("quick_link_clicked", {
                        link_name: "Testimonial/Feedback",
                      });
                      setFeedbackOpen(true);
                    }}
                    className="block cursor-pointer text-sm text-gray-600 hover:text-gray-800"
                  >
                    Testimonial/Feedback
                  </button>
                  <Link
                    href="/profile"
                    prefetch={false}
                    onClick={() =>
                      posthog.capture("quick_link_clicked", {
                        link_name: "My Profile",
                      })
                    }
                    className="block text-sm text-gray-600 hover:text-gray-800"
                  >
                    My Profile
                  </Link>
                </div>
              </div>

              <FeaturedOpportunities />
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-6 max-h-[90vh] overflow-y-auto pr-2 thin-scrollbar">
            <PageBannerCarousel
              placement="ungatekeep"
              className="mb-4 w-full lg:mb-6"
            />
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

            {error ? (
              <div className="rounded-lg border bg-white py-12 text-center">
                <h3 className="mb-2 text-lg font-semibold text-red-600">
                  Failed to load saved posts
                </h3>
                <p className="mb-6 text-gray-500">
                  {axios.isAxiosError(error) && error.response?.status === 401
                    ? "Please log in to see your saved posts."
                    : error.message || "An unknown error occurred."}
                </p>
                {axios.isAxiosError(error) && error.response?.status === 401 ? (
                  <Button asChild>
                    <Link href="/ungatekeep/saved?auth=login">Login</Link>
                  </Button>
                ) : (
                  <Button onClick={() => refetch()}>Retry</Button>
                )}
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
              <div className="w-full space-y-2 lg:space-y-4">
                {savedPosts.map((post: any) => (
                  <UngatekeepCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="col-span-3">
            <div className="sticky top-6 space-y-6">
              <FeaturedToolkits />
            </div>
          </aside>
        </div>

        {/* Mobile Feed */}
        <div className="lg:hidden">
          <PageBannerCarousel
            placement="ungatekeep"
            className="mb-4 w-full"
          />
          <div className="mb-4">
            <Button
              variant="ghost"
              asChild
              className="mb-4 -ml-2 text-muted-foreground hover:text-primary h-auto p-0"
            >
              <Link href="/ungatekeep">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Ungatekeep
              </Link>
            </Button>
            <h1 className="mb-1 text-xl font-bold text-gray-900">
              Saved Posts
            </h1>
            <p className="text-xs text-gray-600">
              Your collection of saved ungatekeep posts
            </p>
          </div>

          <div className="w-full space-y-2">
            {error ? (
              <div className="rounded-lg border bg-white py-12 text-center">
                <h3 className="mb-2 text-lg font-semibold text-red-600">
                  Failed to load saved posts
                </h3>
                <p className="mb-6 px-4 text-xs text-gray-500">
                  {axios.isAxiosError(error) && error.response?.status === 401
                    ? "Please log in to see your saved posts."
                    : error.message || "An unknown error occurred."}
                </p>
                {axios.isAxiosError(error) && error.response?.status === 401 ? (
                  <Button asChild size="sm">
                    <Link href="/ungatekeep/saved?auth=login">Login</Link>
                  </Button>
                ) : (
                  <Button onClick={() => refetch()} size="sm">
                    Retry
                  </Button>
                )}
              </div>
            ) : savedPosts.length === 0 ? (
              <div className="rounded-lg border bg-white py-12 text-center">
                <Bookmark className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <h3 className="mb-2 text-lg font-semibold text-gray-600">
                  No saved posts yet
                </h3>
                <Button asChild className="mt-4">
                  <Link href="/ungatekeep">Explore Posts</Link>
                </Button>
              </div>
            ) : (
              savedPosts.map((post: any) => (
                <UngatekeepCard key={post.id} post={post} />
              ))
            )}
          </div>
        </div>
      </div>
      <FeedbackWidget isOpen={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
