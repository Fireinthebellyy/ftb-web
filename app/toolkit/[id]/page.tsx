"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toolkit, ToolkitContentItem } from "@/types/interfaces";
import ToolkitSidebar from "@/components/toolkit/ToolkitSidebar";
import ContentList from "@/components/toolkit/ContentList";
import { useToolkit, useToolkitPurchase } from "@/lib/queries";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ToolkitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);

  const { data: toolkitData, isLoading } = useToolkit(params.id as string);
  const purchaseMutation = useToolkitPurchase(params.id as string);

  const toolkit = toolkitData?.toolkit ?? null;
  const contentItems = toolkitData?.contentItems ?? [];
  const hasPurchased = toolkitData?.hasPurchased ?? false;

  const handlePurchase = async () => {
    try {
      setIsPurchaseLoading(true);
      await purchaseMutation.mutateAsync();
    } finally {
      setIsPurchaseLoading(false);
    }
  };

  const handleViewContent = () => {
    router.push(`/toolkit/${toolkit?.id}/content`);
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = toolkit?.videoUrl
    ? getYouTubeVideoId(toolkit.videoUrl)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!toolkit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Toolkit Not Found</h2>
          <p className="mb-6 text-gray-600">
            The toolkit you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push("/toolkit")}>
            Back to Toolkits
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/toolkit")}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          ← Back to Toolkits
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6 overflow-hidden rounded-lg border bg-white">
              <div className="relative aspect-video bg-gray-100">
                {toolkit.coverImageUrl ? (
                  <Image
                    src={toolkit.coverImageUrl}
                    alt={toolkit.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-100">
                    <span className="text-6xl font-bold text-gray-300">
                      {toolkit.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {toolkit.category && (
                    <Badge variant="secondary">{toolkit.category}</Badge>
                  )}
                </div>

                <h1 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">
                  {toolkit.title.charAt(0).toUpperCase() +
                    toolkit.title.slice(1)}
                </h1>

                {toolkit.creatorName && (
                  <p className="mb-4 text-sm text-gray-600">
                    Created by{" "}
                    <span className="font-medium text-gray-900">
                      {toolkit.creatorName}
                    </span>
                  </p>
                )}

                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {toolkit.lessonCount && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      {toolkit.lessonCount} lessons
                    </div>
                  )}

                  {toolkit.totalDuration && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {toolkit.totalDuration}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                      />
                    </svg>
                    Lifetime access
                  </div>
                </div>

                <p className="text-gray-700">
                  {toolkit.description.charAt(0).toUpperCase() +
                    toolkit.description.slice(1)}
                </p>

                {toolkit.highlights && toolkit.highlights.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-semibold text-gray-900">
                      What you&apos;ll learn:
                    </h3>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {toolkit.highlights.map((highlight, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-gray-600"
                        >
                          <svg
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {contentItems.length > 0 && (
              <div className="rounded-lg border bg-white p-6">
                <ContentList items={contentItems} hasPurchased={hasPurchased} />
              </div>
            )}

            {videoId && (
              <div className="mt-6 overflow-hidden rounded-lg border bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Preview
                </h3>
                <div className="aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={toolkit.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:col-span-1 lg:block">
            <ToolkitSidebar
              toolkit={toolkit}
              contentItems={contentItems}
              hasPurchased={hasPurchased}
              isPurchaseLoading={isPurchaseLoading}
              onPurchase={handlePurchase}
              onAccessContent={handleViewContent}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky purchase bar */}
      <div className="fixed right-0 bottom-[52px] left-0 z-50 border-t bg-white p-4 shadow-lg md:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ₹{toolkit.price.toLocaleString("en-IN")}
            </span>
            {toolkit.originalPrice && toolkit.originalPrice > toolkit.price && (
              <span className="text-sm text-gray-400 line-through">
                ₹{toolkit.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          {hasPurchased ? (
            <Button onClick={handleViewContent} size="lg" className="flex-1">
              Access Content
            </Button>
          ) : (
            <Button
              onClick={handlePurchase}
              disabled={isPurchaseLoading}
              size="lg"
              className="flex-1"
            >
              {isPurchaseLoading ? "Processing..." : "Buy Now"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
