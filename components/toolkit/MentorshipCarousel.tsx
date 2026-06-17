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
  imageUrl: string | null;
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
    <div className="mb-8 w-full max-w-[1646px] mx-auto px-4">
      {/* Wrapper: h-[182px] on mobile, md:h-[166px] on desktop. flex-row always */}
      <div className="bg-[#ff5e14] rounded-2xl p-3 sm:p-5 flex flex-row items-center gap-3 md:gap-6 shadow-md relative overflow-hidden md:overflow-visible h-[182px] md:h-[166px] max-w-[386px] md:max-w-none mx-auto">
        
        {/* Left side: Static Mentor Image (Rectangle on mobile, Circle on desktop) */}
        <div className="shrink-0 flex items-center justify-center relative z-10 h-full">
          {activeMentor?.mentorImage ? (
            <div className="h-full max-h-[158px] w-[110px] rounded-lg md:h-[134px] md:w-[134px] md:rounded-full overflow-hidden border-2 md:border-4 border-white/20 shadow-md shrink-0 bg-white">
              <img
                src={activeMentor.mentorImage}
                alt={activeMentor.mentorName || "Mentor"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-full max-h-[158px] w-[110px] rounded-lg md:h-[134px] md:w-[134px] md:rounded-full bg-white/10 flex items-center justify-center border-2 md:border-4 border-white/20 shadow-md shrink-0">
              <span className="text-white font-medium text-xs md:text-sm">No Image</span>
            </div>
          )}
        </div>

        {/* Right side: Carousel */}
        <div className="flex-grow w-full min-w-0 relative z-10 h-full">
          <Carousel
            plugins={[plugin.current]}
            className="w-full h-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent className="h-full">
              {/* Slide 1: Mentor Info */}
              {hasMentor && (
                <CarouselItem className="h-full">
                  <div className="bg-white rounded-xl px-4 py-3 md:px-6 md:py-4 flex flex-col justify-center h-full shadow-sm">
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
                </CarouselItem>
              )}

              {/* Slide 2+: Dynamic Slides */}
              {slides.map((slide) => (
                <CarouselItem key={slide.id} className="h-full">
                  <div className="bg-white rounded-xl px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 h-full shadow-sm">
                    {slide.imageUrl && (
                      <div className="h-12 w-12 md:h-20 md:w-20 shrink-0 hidden md:block">
                        <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-contain rounded-md" />
                      </div>
                    )}
                    <div className="flex flex-col justify-center min-w-0 h-full">
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-1.5 leading-tight tracking-tight truncate">
                        {slide.title}
                      </h3>
                      {slide.description && (
                        <p className="text-xs md:text-sm font-medium text-gray-600 leading-snug md:leading-relaxed max-w-3xl line-clamp-4 md:line-clamp-2">
                          {slide.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {totalSlides > 1 && (
              <>
                <CarouselPrevious className="hidden md:flex absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 border-gray-200 shadow-md hover:bg-gray-50 h-8 w-8" />
                <CarouselNext className="hidden md:flex absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 border-gray-200 shadow-md hover:bg-gray-50 h-8 w-8" />
              </>
            )}
          </Carousel>
        </div>
        
      </div>
    </div>
  );
}
