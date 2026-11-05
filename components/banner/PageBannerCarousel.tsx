"use client";

import { useEffect, useRef, useState } from "react";
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
import { PageBannerPlacement, usePageBanners } from "@/lib/queries-sanity";
import { cn } from "@/lib/utils";

interface PageBannerCarouselProps {
  placement: PageBannerPlacement;
  className?: string;
}

export default function PageBannerCarousel({
  placement,
  className,
}: PageBannerCarouselProps) {
  const [mounted, setMounted] = useState(false);
  const autoplayRef = useRef(Autoplay({ delay: CAROUSEL_AUTOPLAY_DELAY_MS }));
  const { data: pageBanners = [], isLoading } = usePageBanners(placement);

  useEffect(() => {
    setMounted(true);
  }, []);

  const banners = pageBanners.filter((b) => Boolean(b.image?.asset?.url));

  if (!mounted || isLoading) {
    return (
      <div className={cn("mb-4 w-full", className)}>
        <Skeleton className="h-[145px] w-full rounded-2xl sm:h-[175px] md:h-[190px] lg:h-[200px]" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const handleBannerClick = (
    bannerId: string,
    title: string,
    href: string,
    index: number
  ) => {
    const eventName =
      placement === "ungatekeep"
        ? "ungatekeep_banner_clicked"
        : `${placement}_banner_clicked`;

    posthog.capture(eventName, {
      banner_id: bannerId,
      title,
      placement,
      source: `${placement}_promotional_hero`,
      slide_index: index,
      target_url: href,
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
            const rawHref = (banner.link || banner.url || "").trim();
            const isClickable = Boolean(rawHref);
            const isExternal = /^https?:\/\//i.test(rawHref);
            const title =
              banner.title || banner.image?.alt || `${placement} banner`;

            const slideInner = (
              <div className="relative h-[145px] w-full overflow-hidden sm:h-[175px] md:h-[190px] lg:h-[200px]">
                {banner.image?.asset?.url ? (
                  <Image
                    src={banner.image.asset.url}
                    alt={title}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 850px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-900" />
                )}
              </div>
            );

            return (
              <CarouselItem key={banner._id} className="pl-0">
                {isClickable ? (
                  isExternal ? (
                    <a
                      href={rawHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        handleBannerClick(banner._id, title, rawHref, index)
                      }
                      className="block h-full w-full"
                    >
                      {slideInner}
                    </a>
                  ) : (
                    <Link
                      href={rawHref}
                      onClick={() =>
                        handleBannerClick(banner._id, title, rawHref, index)
                      }
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
