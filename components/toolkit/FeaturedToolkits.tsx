"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import { useToolkits } from "@/lib/queries/toolkits";

export default function FeaturedToolkits() {
  const { data: toolkits = [], isLoading } = useToolkits();
  const featuredToolkits = toolkits.slice(0, 3);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <Skeleton className="h-5 w-32 mb-3" />
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
    <div className="rounded-lg border bg-white p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Featured Toolkits</h3>
      <div className="space-y-2">
        {featuredToolkits.map((toolkit) => (
          <Link
            key={toolkit.id}
            href={`/toolkit/${toolkit.id}`}
            className="block group"
          >
            <article className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              {/* Left: Square Image */}
              <div className="relative shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
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
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                    <span className="text-lg font-bold text-orange-300">
                      {toolkit.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                {/* Top: Title */}
                <div>
                  <h4 className="text-sm font-semibold leading-tight text-foreground line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {toolkit.title}
                  </h4>
                  {toolkit.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {toolkit.description}
                    </p>
                  )}
                </div>

                {/* Bottom: Price + Category */}
                <div className="flex items-center gap-1.5 mt-1">
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
                          <span className="text-sm font-bold text-gray-900">—</span>
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
                      className="shrink-0 text-[10px] px-1 py-0 h-4 ml-auto"
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
