"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import posthog from "posthog-js";

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselDotsOverlay,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { CAROUSEL_AUTOPLAY_DELAY_MS } from "@/lib/carousel";
import { usePageBanners } from "@/lib/queries-sanity";
import { cn } from "@/lib/utils";

interface SanityBannerSlide {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
  isExternal: boolean;
  placement: string;
}

export default function ToolkitBanner({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const autoplayRef = useRef(Autoplay({ delay: CAROUSEL_AUTOPLAY_DELAY_MS }));

  const { data: pageBanners = [], isLoading: pageBannersLoading } =
    usePageBanners("internship");

  useEffect(() => {
    setMounted(true);
  }, []);

  const banners = useMemo<SanityBannerSlide[]>(() => {
    return (pageBanners || [])
      .filter((b) => Boolean(b.image?.asset?.url))
      .map((banner) => {
        const rawHref = (banner.link || banner.url || "").trim();
        const isExternal = /^https?:\/\//i.test(rawHref);
        return {
          id: banner._id,
          title: banner.title || banner.image?.alt || "Featured Promotion",
          imageUrl: banner.image!.asset!.url,
          href: rawHref,
          isExternal,
          placement: banner.placement,
        };
      });
  }, [pageBanners]);

  if (!mounted || pageBannersLoading) {
    return (
      <div className={cn("mb-4 w-full", className)}>
        <Skeleton className="h-[145px] w-full rounded-2xl sm:h-[175px] md:h-[190px] lg:h-[200px]" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const handleBannerClick = (banner: SanityBannerSlide, index: number) => {
    posthog.capture("internship_banner_clicked", {
      banner_id: banner.id,
      title: banner.title,
      placement: banner.placement,
      source: "internship_promotional_hero",
      slide_index: index,
      target_url: banner.href,
    });
  };

  return (
    <div
      className={cn(
        "group relative mb-4 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-xs",
        className
      )}
    >
      <Carousel
        opts={{
          align: "start",
          loop: banners.length > 1,
        }}
        plugins={banners.length > 1 ? [autoplayRef.current] : []}
        className="relative w-full"
      >
        <CarouselContent className="-ml-0">
          {banners.map((banner, index) => {
            const isClickable = Boolean(banner.href);

            const slideInner = (
              <div className="relative h-[145px] w-full overflow-hidden sm:h-[175px] md:h-[190px] lg:h-[200px]">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 850px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              </div>
            );

            return (
              <CarouselItem key={banner.id} className="pl-0">
                {isClickable ? (
                  banner.isExternal ? (
                    <a
                      href={banner.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleBannerClick(banner, index)}
                      className="block h-full w-full"
                    >
                      {slideInner}
                    </a>
                  ) : (
                    <Link
                      href={banner.href}
                      onClick={() => handleBannerClick(banner, index)}
                      className="block h-full w-full"
                    >
                      {slideInner}
                    </Link>
                  )
                ) : (
                  slideInner
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Navigation Chevrons when multiple banners exist */}
        {banners.length > 1 && (
          <>
            <CarouselPrevious className="top-1/2 left-2 z-20 hidden size-7 -translate-y-1/2 border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/70 hover:text-white sm:left-3 sm:flex sm:size-8" />
            <CarouselNext className="top-1/2 right-2 z-20 hidden size-7 -translate-y-1/2 border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/70 hover:text-white sm:right-3 sm:flex sm:size-8" />
          </>
        )}

        {/* Carousel Pagination Dots when multiple banners exist */}
        {banners.length > 1 && (
          <CarouselDotsOverlay className="bottom-2 sm:bottom-2.5">
            <CarouselDots
              className="gap-1.5 py-0"
              dotClassName="bg-white/40 hover:bg-white/70"
              activeDotClassName="h-1.5 w-3.5 rounded-full bg-white"
            />
          </CarouselDotsOverlay>
        )}
      </Carousel>
    </div>
  );
}

// Named alias export for clear cross-product naming
export { ToolkitBanner as MergedPromoBanner };
