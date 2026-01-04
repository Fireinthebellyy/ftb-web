"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Toolkit, ToolkitContentItem } from "@/types/interfaces";

interface PurchaseSidebarProps {
  toolkit: Toolkit;
  contentItems: ToolkitContentItem[];
  hasPurchased: boolean;
  isPurchaseLoading: boolean;
  onPurchase: () => void;
  onAccessContent: () => void;
  className?: string;
}

export default function PurchaseSidebar({
  toolkit,
  contentItems: _contentItems,
  hasPurchased,
  isPurchaseLoading,
  onPurchase,
  onAccessContent,
  className,
}: PurchaseSidebarProps) {
  const hasOriginalPrice =
    toolkit.originalPrice && toolkit.originalPrice > toolkit.price;
  const discountPercentage = hasOriginalPrice
    ? Math.round(
      ((toolkit.originalPrice! - toolkit.price) / toolkit.originalPrice!) *
      100
    )
    : 0;

  return (
    <Card className={cn("sticky top-8 overflow-hidden shadow-xl py-0", className)}>
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white">
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            ₹{toolkit.price.toLocaleString("en-IN")}
          </span>
          {hasOriginalPrice && (
            <span className="text-lg text-white/70 line-through">
              ₹{toolkit.originalPrice!.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {hasOriginalPrice && (
          <Badge className="bg-white text-orange-600">
            {discountPercentage}% OFF
          </Badge>
        )}
      </div>

      <CardContent className="p-6">
        {hasPurchased ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">You own this toolkit</span>
            </div>

            <Button
              onClick={onAccessContent}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
              size="lg"
            >
              Access Content
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              onClick={onPurchase}
              disabled={isPurchaseLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
              size="lg"
            >
              {isPurchaseLoading ? "Processing..." : "Buy Now"}
            </Button>

            <p className="text-center text-xs text-gray-500">
              Secure payment via Razorpay
            </p>
          </div>
        )}

        <Separator className="my-6" />

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">
            This toolkit includes:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            {toolkit.highlights?.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {highlight}
              </li>
            ))}

            {toolkit.lessonCount && (
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {toolkit.lessonCount} lessons
              </li>
            )}

            {toolkit.totalDuration && (
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {toolkit.totalDuration} of content
              </li>
            )}

            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Lifetime access
            </li>

            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Access on all devices
            </li>
          </ul>
        </div>

        <Separator className="my-6" />

        <div className="rounded-lg bg-orange-50 p-3 text-center">
          <p className="text-xs text-orange-800">
            <strong>100% satisfaction guaranteed</strong>
            <br />
            30-day money-back policy
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
