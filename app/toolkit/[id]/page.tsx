"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toolkit, ToolkitContentItem } from "@/types/interfaces";
import ToolkitSidebar from "@/components/toolkit/ToolkitSidebar";
import ContentList from "@/components/toolkit/ContentList";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ToolkitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [toolkit, setToolkit] = useState<Toolkit | null>(null);
  const [contentItems, setContentItems] = useState<ToolkitContentItem[]>([]);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);

  useEffect(() => {
    const fetchToolkitData = async () => {
      try {
        const toolkitId = params.id as string;

        const response = await axios.get(`/api/toolkits/${toolkitId}`);
        setToolkit(response.data.toolkit);
        setHasPurchased(response.data.hasPurchased);
        setContentItems(response.data.contentItems || []);
      } catch (error) {
        console.error("Error fetching toolkit data:", error);
        toast.error("Failed to load toolkit details");
        router.push("/toolkit");
      } finally {
        setIsLoading(false);
      }
    };

    fetchToolkitData();
  }, [params.id, router]);

  const handlePurchase = async () => {
    try {
      setIsPurchaseLoading(true);

      const response = await axios.post(
        `/api/toolkits/${toolkit?.id}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { order, key } = response.data;

      if (typeof window === "undefined" || !window.Razorpay) {
        toast.error(
          "Payment gateway not loaded. Please refresh the page and try again."
        );
        return;
      }

      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: "Fire in the Belly",
        description: "Toolkit Purchase",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await axios.post(
              `/api/toolkits/${toolkit?.id}/verify`,
              {
                razorpay_order_id: order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            toast.success("Purchase successful! Redirecting to content...");
            setHasPurchased(true);
            router.push(`/toolkit/${toolkit?.id}/content`);
          } catch (error) {
            console.error("Verification failed:", error);
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {},
        theme: {
          color: "#F97316",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Purchase error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        toast.error(errorData.error || "Purchase failed");
      } else {
        toast.error(error instanceof Error ? error.message : "Purchase failed");
      }
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
      <div className="bg-gradient-to-b from-orange-100 to-transparent py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/toolkit")}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            ← Back to Toolkits
          </Button>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl bg-gray-900 shadow-xl">
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
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-400 to-amber-500">
                    <span className="text-6xl font-bold text-white">
                      {toolkit.title.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />

                <div className="absolute right-4 bottom-4 left-4">
                  {toolkit.category && (
                    <Badge className="bg-white/90 text-gray-900">
                      {toolkit.category}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h1 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
                  {toolkit.title}
                </h1>

                {toolkit.creatorName && (
                  <p className="mb-4 text-gray-600">
                    Created by{" "}
                    <span className="font-medium text-orange-600">
                      {toolkit.creatorName}
                    </span>
                  </p>
                )}

                <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {toolkit.lessonCount && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4 text-orange-500"
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
                        className="h-4 w-4 text-orange-500"
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
                      className="h-4 w-4 text-orange-500"
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

                <p className="text-lg leading-relaxed text-gray-700">
                  {toolkit.description}
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
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <svg
                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500"
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

              {contentItems.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <ContentList
                    items={contentItems}
                    hasPurchased={hasPurchased}
                  />
                </div>
              )}

              {videoId && (
                <div className="mt-8">
                  <h3 className="mb-4 text-xl font-semibold text-gray-900">
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
                      className="rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
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
      </div>
    </div>
  );
}
