"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Toolkit } from "@/types/interfaces";
import { ArrowRight } from "lucide-react";
import { stripHtml } from "@/lib/utils";

interface MentorshipCardProps {
  toolkit: Toolkit;
  href: string;
}

export default function MentorshipCard({ toolkit, href }: MentorshipCardProps) {
  const imageUrl = toolkit.coverImageUrl || toolkit.bannerImageUrl;
  const mentor = toolkit.mentorshipDetails?.mentor;
  const hasOriginalPrice = toolkit.originalPrice && toolkit.originalPrice > toolkit.price;

  return (
    <Link href={href} className="block h-full group" prefetch>
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md cursor-pointer py-0 gap-0">
        {/* Top: Cover Image */}
        <div className="relative w-full aspect-[4/3] shrink-0 bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={toolkit.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-xl font-bold text-gray-300">Images</span>
            </div>
          )}
        </div>

        <CardContent className="flex flex-col flex-1 p-5 pt-4">
          {/* Mentor Info Row */}
          <div className="flex items-start gap-4 mb-4">
            {/* Mentor Avatar Box */}
            <div className="relative shrink-0 flex items-center justify-center mt-1">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-gray-100 relative">
                {mentor?.imageUrl ? (
                  <Image
                    src={mentor.imageUrl}
                    alt={mentor?.name || "Mentor"}
                    fill
                    className="object-cover"
                  />
                ) : (
                   <span className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                    {mentor?.name?.charAt(0) || "M"}
                  </span>
                )}
              </div>
            </div>

            {/* Mentor Labels */}
            <div className="flex flex-col gap-1.5 pt-1">
              {/* Mentor Name Box */}
              <div className="bg-gray-900 text-white px-3 py-1 font-medium text-sm rounded-sm w-fit inline-block">
                {mentor?.name || toolkit.creatorName || "Provide mentor details"}
              </div>
              {/* Mentor Description Box */}
              <div className="bg-gray-900 text-white px-3 py-1 text-xs rounded-sm w-fit inline-block">
                {stripHtml(mentor?.description || "Mentor Description")}
              </div>
            </div>
          </div>

          {/* Course Description */}
          <div className="flex flex-col flex-1 mb-4 text-left">
            <h3 className="text-[20px] font-bold text-gray-900 leading-tight transition-colors group-hover:text-gray-700">
              {toolkit.title || "Description of the course"}
            </h3>
            {toolkit.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
                {stripHtml(toolkit.description)}
              </p>
            )}
          </div>

          {/* Bottom Bar: Price (Copied from previous card) */}
          <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-4">
            <div>
              <div className="mb-1 text-[10px] font-semibold tracking-wider text-gray-400">
                PRICE
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-gray-900">
                  ₹{toolkit.price.toLocaleString("en-IN")}
                </span>
                {hasOriginalPrice && (
                  <span className="text-xs font-medium text-gray-400 line-through">
                    ₹{toolkit.originalPrice!.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>

            <div className="group-hover:text-[#ff5e14] flex items-center gap-1 text-sm font-medium text-[#ff5e14] transition-colors">
              View Details
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
