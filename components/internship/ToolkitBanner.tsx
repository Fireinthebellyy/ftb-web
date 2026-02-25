import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function ToolkitBanner() {
    const toolkits = [
        {
            id: 1,
            title: "Resume Masterclass",
            price: "$19.99",
            image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80",
        },
        {
            id: 2,
            title: "Interview Guide",
            price: "$24.99",
            image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
        },
        {
            id: 3,
            title: "Portfolio Building",
            price: "$14.99",
            image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
        }
    ];

    const bannerSlides = [
        {
            title: "Boost your hireability by 80% with our expert-led toolkits",
            subtitle: "Learn exactly what recruiters are looking for.",
            background: "linear-gradient(135deg, #0b4f8c 0%, #2f8ee6 100%)",
        },
        {
            title: "Tired of getting ghosted after applying?",
            subtitle: "See how our ATS-friendly resume templates can help.",
            background: "linear-gradient(135deg, #d35400 0%, #e67e22 100%)",
        },
        {
            title: "Ace your next technical interview",
            subtitle: "Practice with our comprehensive mock interview guide.",
            background: "linear-gradient(135deg, #16a085 0%, #1abc9c 100%)",
        }
    ];

    return (
        <div className="w-full flex flex-col space-y-4 mb-3 sm:mb-4">
            {/* Banner Section */}
            {/* Banner Section Carousel */}
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
                        {bannerSlides.map((slide, index) => (
                            <CarouselItem key={index} className="pl-0 cursor-grab active:cursor-grabbing">
                                <div
                                    className="w-full h-full min-h-[56px] sm:min-h-[48px] px-3 py-2 sm:px-4 sm:py-2.5 text-white relative flex items-center justify-center sm:justify-start"
                                    style={{ background: slide.background }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 w-full relative z-10 pointer-events-none text-center sm:text-left">
                                        <h2 className="text-[13px] sm:text-sm font-semibold leading-tight">
                                            {slide.title}
                                        </h2>
                                        <p className="text-[11px] sm:text-xs text-white/90 leading-tight">
                                            {slide.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>

            {/* Premium Toolkits Section */}
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
                                style={{ backgroundImage: `url(${toolkit.image})` }}
                            />

                            {/* Gradient Overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5 text-white flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[11px] sm:text-xs leading-tight mb-0.5">{toolkit.title}</span>
                                    <span className="text-[9px] sm:text-[10px] text-gray-200">{toolkit.price}</span>
                                </div>
                                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0 ml-1" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
