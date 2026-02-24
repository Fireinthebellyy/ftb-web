import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    return (
        <div className="w-full flex flex-col space-y-4 mb-8">
            {/* Banner Section */}
            <div
                className="w-full rounded-2xl p-6 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0b4f8c 0%, #2f8ee6 100%)' }}
            >
                <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-6 max-w-[80%]">
                    Boost your hireability by 80% with our expert-led toolkits
                </h2>

                <div className="flex items-center justify-between">
                    <Button
                        variant="secondary"
                        className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-6 py-2 rounded-xl border-none"
                    >
                        Get Started
                    </Button>

                    {/* Pagination dots (aesthetic for now) */}
                    <div className="flex gap-1.5 opacity-80 z-10">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        <div className="w-2 h-2 rounded-full bg-white/50"></div>
                        <div className="w-2 h-2 rounded-full bg-white/50"></div>
                    </div>
                </div>
            </div>

            {/* Premium Toolkits Section */}
            <div className="pt-2">
                {/* Horizontal Scrolling List */}
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {toolkits.map((toolkit) => (
                        <Link
                            href={`/toolkit/${toolkit.id}`}
                            key={toolkit.id}
                            className="relative min-w-[200px] h-[140px] rounded-2xl overflow-hidden shrink-0 snap-start group"
                        >
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                                style={{ backgroundImage: `url(${toolkit.image})` }}
                            />

                            {/* Gradient Overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm leading-tight mb-1">{toolkit.title}</span>
                                    <span className="text-xs text-gray-200">{toolkit.price}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-white" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
