"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import { useToolkits } from "@/lib/queries/toolkits";
import { stripHtml } from "@/lib/utils";

export default function FeaturedToolkits() {
  const { data: toolkits = [], isLoading } = useToolkits();
  const featuredToolkits = toolkits.slice(0, 3);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (featuredToolkits.length === 0) {
    return null;
  }

  return (
    <div className="hidden rounded-lg border bg-white p-4 lg:block">
      <h3 className="mb-3 font-semibold text-gray-900">Featured Toolkits</h3>
      <div className="space-y-2">
        {featuredToolkits.map((toolkit) => (
          <Link
            key={toolkit.id}
            href={`/toolkit/${toolkit.id}`}
            className="group block"
          >
            <article className="hover:bg-muted/50 flex gap-3 rounded-lg p-2 transition-colors">
              {/* Left: Square Image */}
              <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                {toolkit.coverImageUrl ? (
                  <>
                    <Image
                      src={toolkit.coverImageUrl}
                      alt={toolkit.title}
                      fill
                      className="object-cover"
                    />
                    {toolkit.videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="rounded-full bg-white/90 p-1">
                          <Play className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                    <span className="text-lg font-bold text-orange-300">
                      {toolkit.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Content */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                {/* Top: Title */}
                <div>
                  <h4 className="text-foreground line-clamp-1 text-sm leading-tight font-semibold transition-colors group-hover:text-orange-600">
                    {toolkit.title}
                  </h4>
                  {toolkit.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {stripHtml(toolkit.description)}
                    </p>
                  )}
                </div>

                {/* Bottom: Price + Category */}
                <div className="mt-1 flex items-center gap-1.5">
                  {(() => {
                    const displayPrice = toolkit.price ?? null;
                    const currentPrice = toolkit.price ?? 0;
                    const showOriginalPrice =
                      toolkit.originalPrice != null &&
                      toolkit.originalPrice > currentPrice;

                    return (
                      <>
                        {displayPrice != null ? (
                          <span className="text-sm font-bold text-gray-900">
                            ₹{displayPrice.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-gray-900">
                            —
                          </span>
                        )}
                        {showOriginalPrice && (
                          <span className="text-[10px] text-gray-400 line-through">
                            ₹{toolkit.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </>
                    );
                  })()}
                  {toolkit.category && (
                    <Badge
                      variant="outline"
                      className="ml-auto h-4 shrink-0 px-1 py-0 text-[10px]"
                    >
                      {toolkit.category}
                    </Badge>
                  )}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
