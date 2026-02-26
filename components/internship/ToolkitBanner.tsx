"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

import { useToolkits } from '@/lib/queries/toolkits';
import { useBanners } from '@/lib/queries/banners';

export default function ToolkitBanner() {
    const [mounted, setMounted] = useState(false);
    const { data: toolkits = [], isLoading: toolkitsLoading } = useToolkits();
    const { data: bannerSlides = [], isLoading: bannersLoading } = useBanners();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || toolkitsLoading || bannersLoading) {
        return <div className="w-full h-24 animate-pulse bg-slate-100 rounded-lg mb-4" />;
    }

    return (
        <div className="w-full flex flex-col space-y-4 mb-3 sm:mb-4">
            {/* Banner Section Carousel */}
            {bannerSlides.length > 0 && (
                <div className="w-full">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 4000,
                            }),
                        ]}
                        className="w-full relative overflow-hidden rounded-lg group"
                    >
                        <CarouselContent className="-ml-0">
                            {bannerSlides.map((slide) => (
                                <CarouselItem key={slide.id} className="pl-0 cursor-grab active:cursor-grabbing">
                                    <div
                                        className="w-full h-full min-h-[56px] sm:min-h-[48px] px-3 py-2 sm:px-4 sm:py-2.5 text-white relative flex items-center justify-center sm:justify-start"
                                        style={{ background: slide.background || 'linear-gradient(135deg, #0b4f8c 0%, #2f8ee6 100%)' }}
                                    >
                                        <div className="flex flex-col gap-0.5 w-full relative z-10 pointer-events-none text-center sm:text-left">
                                            <h2 className="text-[13px] sm:text-sm font-semibold leading-tight">
                                                {slide.title}
                                            </h2>
                                            {slide.subtitle && (
                                                <p className="text-[11px] sm:text-xs text-white/90 leading-tight">
                                                    {slide.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        {slide.link && <Link href={slide.link} className="absolute inset-0 z-20" />}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            )}

            {/* Premium Toolkits Section */}
            {toolkits.length > 0 && (
                <div className="pt-1">
                    {/* Horizontal Scrolling List */}
                    <div className="flex overflow-x-auto gap-3 pb-3 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {toolkits.map((toolkit) => (
                            <Link
                                href={`/toolkit/${toolkit.id}`}
                                key={toolkit.id}
                                className="relative min-w-[130px] sm:min-w-[140px] h-[85px] sm:h-[95px] rounded-lg overflow-hidden shrink-0 snap-start group"
                            >
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                                    style={{ backgroundImage: toolkit.coverImageUrl ? `url(${toolkit.coverImageUrl})` : 'none' }}
                                />
                                {!toolkit.coverImageUrl && <div className="absolute inset-0 bg-slate-200" />}

                                {/* Gradient Overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5 text-white flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-[11px] sm:text-xs leading-tight mb-0.5 line-clamp-2">{toolkit.title}</span>
                                        <span className="text-[9px] sm:text-[10px] text-gray-200">${toolkit.price}</span>
                                    </div>
                                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0 ml-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
