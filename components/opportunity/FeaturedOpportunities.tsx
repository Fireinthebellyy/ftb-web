import React, { memo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useFeatured } from "@/lib/queries-sanity";
import { Loader2, ExternalLink } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const FeaturedOpportunities: React.FC = memo(() => {
  const { data: featured = [], isLoading, error } = useFeatured(4);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState<any>(null);

  // Auto-rotation effect
  useEffect(() => {
    if (!carouselApi || featured.length <= 1) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [carouselApi, featured.length]);

  // Track carousel slide changes to update dots
  useEffect(() => {
    if (!carouselApi) return;

    const handleSlideChange = () => {
      const currentIndex = carouselApi.selectedScrollSnap();
      setCurrentSlide(currentIndex);
    };

    carouselApi.on("select", handleSlideChange);

    // Set initial slide
    setCurrentSlide(carouselApi.selectedScrollSnap());

    return () => {
      carouselApi.off("select", handleSlideChange);
    };
  }, [carouselApi]);

  const handleDotClick = useCallback(
    (index: number) => {
      if (carouselApi) {
        carouselApi.scrollTo(index);
        setCurrentSlide(index);
      }
    },
    [carouselApi]
  );

  if (error) {
    return <div>Error loading featured opportunities</div>;
  }

  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Featured</h3>
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        )}
      </div>
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="flex justify-center space-x-1">
            <div className="size-1.5 animate-bounce rounded-full bg-gray-400 delay-75"></div>
            <div className="size-1.5 animate-bounce rounded-full bg-gray-400 delay-100"></div>
            <div className="size-1.5 animate-bounce rounded-full bg-gray-400 delay-150"></div>
          </div>
        </div>
      ) : featured && featured.length > 0 ? (
        <div className="relative">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
            setApi={setCarouselApi}
          >
            <CarouselContent>
              {featured.map((item, index) => (
                <CarouselItem
                  key={item._id || `featured-${index}`}
                  className="basis-full"
                >
                  <div className="group relative">
                    {/* Image Container */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-100">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail.asset.url}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          width={300}
                          height={375}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <svg
                            className="h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {/* Link Icon Button on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white"
                          aria-label={`Open ${item.title} in new tab`}
                        >
                          <ExternalLink className="h-5 w-5 text-gray-700" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Pagination Dots */}
          {featured.length > 1 && (
            <div className="mt-4 flex justify-center space-x-2">
              {featured.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${
                    index === currentSlide
                      ? "w-6 bg-blue-600"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <div className="mb-2 text-4xl">🌟</div>
          <p className="text-sm">No featured posts yet</p>
        </div>
      )}
    </div>
  );
});

FeaturedOpportunities.displayName = "FeaturedOpportunities";

export default FeaturedOpportunities;
