"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toolkit } from "@/types/interfaces";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import axios from "axios";

// Declare global Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ToolkitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [toolkit, setToolkit] = useState<Toolkit | null>(null);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);

  useEffect(() => {
    const fetchToolkitData = async () => {
      try {
        const toolkitId = params.id as string;

        // Fetch toolkit details
        const response = await axios.get(`/api/toolkits/${toolkitId}`);
        setToolkit(response.data.toolkit);
        setHasPurchased(response.data.hasPurchased);
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

      // Step 1: Initiate purchase and get Razorpay order details
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

      // Check if Razorpay is loaded
      if (typeof window === "undefined" || !window.Razorpay) {
        toast.error(
          "Payment gateway not loaded. Please refresh the page and try again."
        );
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: "Fire in the Belly",
        description: "Toolkit Purchase",
        order_id: order.id,
        handler: async (response: any) => {
          // Payment successful, verify and complete
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
        prefill: {
          // You can add user details here if available
        },
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

  // Extract YouTube video ID from URL
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
        </div>
      </div>
    );
  }

  if (!toolkit) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Toolkit Not Found</h2>
        <p className="mb-6 text-gray-600">
          The toolkit you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push("/toolkit")}>
          Back to Toolkits
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => router.push("/toolkit")}
          className="mb-6"
        >
          ← Back to Toolkits
        </Button>

        <h1 className="mb-2 text-3xl font-bold">{toolkit.title}</h1>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left side - Cover Image and Video */}
          <div className="space-y-6">
            {/* Cover Image */}
            {toolkit.coverImageUrl && (
              <div className="relative aspect-video overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={toolkit.coverImageUrl}
                  alt={toolkit.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}

            {/* YouTube Video */}
            {videoId && (
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
            )}
          </div>

          {/* Right side - Details and Purchase */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Description</h3>
              <p className="text-gray-600">{toolkit.description}</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-gray-600">Price</span>
                <span className="text-primary text-2xl font-bold">
                  ₹{toolkit.price.toFixed(2)}
                </span>
              </div>

              {hasPurchased ? (
                <Button
                  className="mt-4 w-full"
                  onClick={handleViewContent}
                  size="lg"
                >
                  View Content
                </Button>
              ) : (
                <Button
                  className="mt-4 w-full"
                  onClick={handlePurchase}
                  size="lg"
                  disabled={isPurchaseLoading}
                >
                  {isPurchaseLoading ? "Processing..." : "Buy Now"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
