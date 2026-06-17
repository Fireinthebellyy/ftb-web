/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Loader2 } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

interface Slide {
  id: string;
  title: string;
  description: string | null;
  mobileImageUrl: string | null;
  desktopImageUrl: string | null;
  orderIndex: number;
}

interface Mentor {
  id: string;
  mentorName: string;
  description: string | null;
  mentorImage: string | null;
}

export function MentorshipCarousel({ mentorId }: { mentorId: string | undefined }) {
  const { data: slides = [], isLoading: isLoadingSlides } = useQuery<Slide[]>({
    queryKey: ["mentorship-carousel"],
    queryFn: async () => (await axios.get("/api/mentorship-carousel")).data,
    staleTime: 1000 * 60 * 5,
  });

  const { data: mentors = [], isLoading: isLoadingMentors } = useQuery<Mentor[]>({
    queryKey: ["mentors"],
    queryFn: async () => (await axios.get("/api/mentors")).data,
    staleTime: 1000 * 60 * 5,
  });

  const activeMentor = mentors.find(m => m.id === mentorId);

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  if (isLoadingSlides || isLoadingMentors) {
    return (
      <div className="mb-8 flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // First slide is the mentor, next slides are the carousel slides
  const hasMentor = !!activeMentor;
  const totalSlides = (hasMentor ? 1 : 0) + slides.length;

  if (totalSlides === 0) return null;

  return (
    <div className="-mx-[6px] md:mx-auto md:w-full md:px-4 max-w-[1646px]">
      {/* Wrapper */}
      <div className="bg-[#ff5e14] rounded-2xl py-1 px-2 sm:p-5 shadow-md relative overflow-visible h-[180px] md:h-[166px] w-full mx-auto">
        <Carousel
          plugins={[plugin.current]}
          className="w-full h-full static [&_.overflow-hidden]:h-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent className="h-full ml-0">
            {/* Slide 1: Mentor Info */}
            {hasMentor && (
              <CarouselItem className="h-full pl-0 flex flex-row items-stretch gap-2 md:gap-6 w-full shrink-0">
                {/* Left side: Static Mentor Image */}
                <div className="w-[35%] max-w-[140px] shrink-0 relative z-10 h-full md:w-auto md:max-w-none md:flex md:items-center md:justify-center">
                  {activeMentor?.mentorImage ? (
                    <div className="h-full w-full rounded-2xl md:h-[134px] md:w-[134px] md:rounded-full overflow-hidden border-2 md:border-4 border-white/20 shadow-md bg-white">
                      <img
                        src={activeMentor.mentorImage}
                        alt={activeMentor.mentorName || "Mentor"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full rounded-2xl md:h-[134px] md:w-[134px] md:rounded-full bg-white/10 flex items-center justify-center border-2 md:border-4 border-white/20 shadow-md">
                      <span className="text-white font-medium text-xs md:text-sm text-center px-1">No Image</span>
                    </div>
                  )}
                </div>

                {/* Right side: Text container */}
                <div className="flex-grow w-full min-w-0 relative z-10 h-full">
                  <div className="bg-white rounded-2xl p-3 md:px-6 md:py-4 flex flex-col justify-center shadow-sm w-full h-full shrink-0">
                    <div className="flex items-center gap-2 mb-1.5 hidden md:flex">
                      <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                      <p className="text-[10px] sm:text-xs font-bold text-[#ff5e14] uppercase tracking-wider">Available for 1:1 Mentorship</p>
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-1.5 leading-tight tracking-tight truncate">
                      {activeMentor.mentorName}
                    </h3>
                    {activeMentor.description && (
                      <p className="text-xs md:text-sm font-medium text-gray-600 leading-snug md:leading-relaxed max-w-3xl line-clamp-4 md:line-clamp-2">
                        {activeMentor.description}
                      </p>
                    )}
                  </div>
                </div>
              </CarouselItem>
            )}

            {/* Slide 2+: Dynamic Slides */}
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="h-full pl-0 flex items-center w-full shrink-0">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm w-full h-full flex flex-col justify-center shrink-0 relative">
                  {(slide.mobileImageUrl || slide.desktopImageUrl) ? (
                    <>
                      {slide.mobileImageUrl && <img src={slide.mobileImageUrl} alt={slide.title} className="w-full h-full object-cover md:hidden" />}
                      {slide.desktopImageUrl && <img src={slide.desktopImageUrl} alt={slide.title} className="hidden md:block w-full h-full object-cover" />}
                      
                      {/* Fallbacks if one image is missing */}
                      {slide.mobileImageUrl && !slide.desktopImageUrl && <img src={slide.mobileImageUrl} alt={slide.title} className="hidden md:block w-full h-full object-cover" />}
                      {slide.desktopImageUrl && !slide.mobileImageUrl && <img src={slide.desktopImageUrl} alt={slide.title} className="w-full h-full object-cover md:hidden" />}
                    </>
                  ) : (
                    <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col justify-center h-full">
                      <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-1.5 leading-tight tracking-tight truncate">
                        {slide.title}
                      </h3>
                      {slide.description && (
                        <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-600 leading-snug md:leading-relaxed max-w-3xl line-clamp-4 md:line-clamp-2">
                          {slide.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {totalSlides > 1 && (
            <>
              <CarouselPrevious className="flex absolute -left-3 sm:-left-4 md:-left-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 border-gray-200 shadow-md hover:bg-gray-50 h-7 w-7 md:h-8 md:w-8 z-20" />
              <CarouselNext className="flex absolute -right-3 sm:-right-4 md:-right-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 border-gray-200 shadow-md hover:bg-gray-50 h-7 w-7 md:h-8 md:w-8 z-20" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
}
