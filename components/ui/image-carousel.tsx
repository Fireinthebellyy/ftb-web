"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDotsOverlay,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

export function ImageCarousel({ images, className = "" }: ImageCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setSelectedIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Carousel
        setApi={setApi}
        className="w-full max-h-96"
        plugins={[
          Autoplay({
            delay: 3000,
          }),
        ]}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative overflow-hidden rounded-lg max-h-96 cursor-pointer" onClick={() => handleImageClick(index)}>
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-auto object-contain max-h-96"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" />
            <CarouselNext className="right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" />
            <CarouselDotsOverlay />
          </>
        )}
      </Carousel>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxOpen(false)}>
          <div className="relative max-w-5xl max-h-full w-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="relative flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                onClick={() => {
                  setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <img
                src={images[selectedIndex]}
                alt={`Image ${selectedIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                onClick={() => {
                  setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
