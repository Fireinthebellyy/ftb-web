"use client";

import { useFeatured } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function FeaturedPage() {
  const { data: featured = [], isLoading, error } = useFeatured();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error loading featured items: {(error as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full grow bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
              Featured Opportunities
            </h1>
            <p className="text-sm sm:text-lg text-gray-600 mb-4">
              Highlighted hackathons, grants, and competitions
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border p-4 space-y-4"
              >
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((item, index) => (
              <div
                key={item._id || `featured-${index}`}
                className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div
                  className={`relative h-48 ${
                    !item.thumbnail
                      ? "bg-gradient-to-br from-gray-100 to-gray-200"
                      : ""
                  }`}
                >
                  {item.thumbnail && (
                    <Image
                      src={item.thumbnail.asset.url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  )}
                  {!item.thumbnail && (
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
                  )}
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {item.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {item.description}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
