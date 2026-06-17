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
    <div className="mb-10 w-full max-w-4xl mx-auto px-10">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {hasMentor && (
            <CarouselItem>
              <div className="flex h-full min-h-[250px] flex-col items-center justify-center gap-4 rounded-2xl border border-orange-100 bg-orange-50/50 p-8 shadow-sm text-center">
                {activeMentor.mentorImage && (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md ring-2 ring-orange-900/10">
                    <img
                      src={activeMentor.mentorImage}
                      alt={activeMentor.mentorName || "Mentor"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Available for 1:1 Mentorship</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                    {activeMentor.mentorName}
                  </h3>
                  {activeMentor.description && (
                    <p className="text-base font-medium text-gray-600 mt-2 max-w-2xl mx-auto">
                      {activeMentor.description}
                    </p>
                  )}
                </div>
              </div>
            </CarouselItem>
          )}

          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="flex h-full min-h-[250px] flex-col sm:flex-row items-center gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                {slide.imageUrl && (
                  <div className="relative h-32 w-32 sm:h-48 sm:w-48 shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col flex-1 justify-center text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
                    {slide.title}
                  </h3>
                  {slide.description && (
                    <p className="text-base text-gray-600 max-w-2xl">
                      {slide.description}
                    </p>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-[-2rem] bg-white hover:bg-gray-100 border-gray-200" />
        <CarouselNext className="right-[-2rem] bg-white hover:bg-gray-100 border-gray-200" />
      </Carousel>
    </div>
  );
}
