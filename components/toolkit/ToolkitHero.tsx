"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ToolkitHeroProps {
  className?: string;
}

export default function ToolkitHero({ className }: ToolkitHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-white py-16 md:py-24",
        className
      )}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-orange-200 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber-200 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Level Up Your <span className="text-orange-600">Career</span>
          </h1>
          <p className="mb-8 text-lg text-gray-600 md:text-xl">
            Expert-crafted toolkits designed to help you land your dream job.
            From interview prep to salary negotiation, we&apos;ve got you
            covered.
          </p>
        </div>
      </div>
    </section>
  );
}
