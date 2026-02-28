"use client";

import { useRef } from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "@/components/ui/carousel";
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
  const { data: banners = [], isLoading } = usePageBanners(placement);
  const autoplayRef = useRef(Autoplay({ delay: CAROUSEL_AUTOPLAY_DELAY_MS }));

  if (isLoading) {
    return (
      <div
        className={cn(
          "h-[96px] w-full animate-pulse overflow-hidden rounded-xl bg-slate-100 sm:h-[84px]",
          className
        )}
      />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className={cn("overflow-hidden rounded-xl", className)}>
      <Carousel
        opts={{
          align: "start",
          loop: banners.length > 1,
        }}
        plugins={[autoplayRef.current]}
        className="relative w-full overflow-hidden"
      >
        <CarouselContent className="-ml-0">
          {banners.map((banner) => (
            <CarouselItem key={banner._id} className="pl-0">
              <div className="relative h-[96px] w-full overflow-hidden rounded-xl sm:h-[84px]">
                {banner.image?.asset?.url ? (
                  <Image
                    src={banner.image.asset.url}
                    alt={banner.image.alt || `${placement} banner`}
                    fill
                    className="object-contain sm:object-cover"
                    sizes="(max-width: 640px) 100vw, 1200px"
                    priority={placement === "internship"}
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-100" />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {banners.length > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center sm:bottom-1">
            <div className="pointer-events-auto rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
              <CarouselDots
                className="gap-1.5 py-0"
                dotClassName="bg-white/45 hover:bg-white/70"
                activeDotClassName="h-1.5 w-3 rounded-full bg-white"
              />
            </div>
          </div>
        ) : null}
      </Carousel>
    </div>
  );
}
