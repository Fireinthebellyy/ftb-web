"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Toolkit } from "@/types/interfaces";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ToolkitModalProps {
  toolkit: Toolkit;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (toolkitId: string) => Promise<void>;
  hasPurchased?: boolean;
}

export default function ToolkitModal({
  toolkit,
  isOpen,
  onClose,
  onPurchase,
  hasPurchased = false,
}: ToolkitModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      await onPurchase(toolkit.id);
      // Payment handling is done in the handler after gateway opens
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to initiate purchase. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewContent = () => {
    router.push(`/toolkit/${toolkit.id}/content`);
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = toolkit.videoUrl ? getYouTubeVideoId(toolkit.videoUrl) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {toolkit.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left side - Cover Image */}
          <div className="space-y-4">
            {toolkit.coverImageUrl && (
              <div className="relative aspect-video overflow-hidden rounded-lg">
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

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-600">Price</span>
                <span className="text-primary text-2xl font-bold">
                  ₹{(toolkit.price / 100).toFixed(2)}
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
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Buy Now"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
