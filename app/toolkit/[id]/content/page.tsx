"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toolkit } from "@/types/interfaces";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function ToolkitContentPage() {
  const params = useParams();
  const router = useRouter();
  const [toolkit, setToolkit] = useState<Toolkit | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchToolkitData = async () => {
      try {
        const toolkitId = params.id as string;

        // Fetch toolkit details
        const toolkitResponse = await fetch(`/api/toolkits/${toolkitId}`);
        if (!toolkitResponse.ok) {
          throw new Error("Toolkit not found");
        }

        const toolkitData = await toolkitResponse.json();
        setToolkit(toolkitData.toolkit);
        setHasAccess(toolkitData.hasPurchased);

        if (!toolkitData.hasPurchased) {
          toast.warning(
            "You need to purchase this toolkit to access the content"
          );
          setTimeout(() => {
            router.push(`/toolkit/${toolkitId}`);
          }, 3000);
        }
      } catch (error) {
        console.error("Error fetching toolkit data:", error);
        toast.error("Failed to load toolkit content");
        router.push("/toolkit");
      } finally {
        setIsLoading(false);
      }
    };

    fetchToolkitData();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
        </div>
      </div>
    );
  }

  if (!toolkit || !hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Access Denied</h2>
        <p className="mb-6 text-gray-600">
          You need to purchase this toolkit to access the content.
        </p>
        <Button onClick={() => router.push("/toolkit")}>
          Back to Toolkits
        </Button>
      </div>
    );
  }

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = toolkit.videoUrl ? getYouTubeVideoId(toolkit.videoUrl) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Button
          variant="outline"
          onClick={() => router.push("/toolkit")}
          className="mb-6"
        >
          ← Back to Toolkits
        </Button>

        <h1 className="mb-2 text-3xl font-bold">{toolkit.title}</h1>
        <p className="mb-6 text-gray-600">{toolkit.description}</p>

        {/* Cover Image */}
        {toolkit.coverImageUrl && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
            <Image
              src={toolkit.coverImageUrl}
              alt={toolkit.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {/* YouTube Video */}
        {videoId && (
          <div className="mb-8 aspect-video">
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

        {/* Toolkit Content */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">Toolkit Content</h2>

          {toolkit.contentUrl ? (
            <div className="mt-6">
              <h3 className="mb-2 text-lg font-medium">Content Resources:</h3>
              <a
                href={toolkit.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Access Full Toolkit Content →
              </a>
            </div>
          ) : (
            <p className="text-gray-600">
              This toolkit content will be available here. Contact support if
              you have any issues accessing your purchased content.
            </p>
          )}

          <div className="mt-8 border-t pt-4">
            <p className="text-sm text-gray-500">
              Thank you for your purchase! This content is now available to you
              indefinitely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
