"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Toolkit, ToolkitContentItem } from "@/types/interfaces";
import { toast } from "sonner";
import axios from "axios";

interface PurchaseSidebarProps {
  toolkit: Toolkit;
  contentItems: ToolkitContentItem[];
  hasPurchased: boolean;
  isPurchaseLoading: boolean;
  onPurchase: (couponCode?: string) => void;
  onAccessContent: () => void;
  className?: string;
}

interface CouponValidationResult {
  valid: boolean;
  discountAmount?: number;
  finalPrice?: number;
  error?: string;
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
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResult | null>(null);

  const hasOriginalPrice =
    toolkit.originalPrice && toolkit.originalPrice > toolkit.price;
  const discountPercentage = hasOriginalPrice
    ? Math.round(
      ((toolkit.originalPrice! - toolkit.price) / toolkit.originalPrice!) *
      100
    )
    : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const { data } = await axios.post<CouponValidationResult>(
        "/api/coupons/validate",
        {
          code: couponCode.trim(),
          toolkitId: toolkit.id,
        }
      );

      if (data.valid && data.discountAmount !== undefined && data.finalPrice !== undefined) {
        setAppliedCoupon(data);
        toast.success(`Coupon applied! ₹${data.discountAmount} off`);
      } else {
        setAppliedCoupon(null);
        toast.error(data.error || "Invalid coupon code");
      }
    } catch (error) {
      setAppliedCoupon(null);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to validate coupon");
      } else {
        toast.error("Failed to validate coupon");
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
  };

  const displayPrice = appliedCoupon?.finalPrice ?? toolkit.price;
  const showCouponDiscount = appliedCoupon?.valid && appliedCoupon.discountAmount;

  return (
    <Card
      className={cn("sticky top-8 overflow-hidden border bg-white py-0", className)}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            ₹{displayPrice.toLocaleString("en-IN")}
          </span>
          {(hasOriginalPrice || showCouponDiscount) && (
            <span className="text-lg text-gray-400 line-through">
              ₹{toolkit.price.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {hasOriginalPrice && (
            <Badge className="bg-green-600 text-white hover:bg-green-700">
              {discountPercentage}% OFF
            </Badge>
          )}
          {showCouponDiscount && (
            <Badge className="bg-blue-600 text-white hover:bg-blue-700">
              ₹{appliedCoupon.discountAmount} OFF
            </Badge>
          )}
        </div>

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

            <Button onClick={onAccessContent} className="w-full" size="lg">
              Access Content
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Coupon Code Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isValidatingCoupon) {
                      handleApplyCoupon();
                    }
                  }}
                  disabled={isValidatingCoupon || !!appliedCoupon?.valid}
                  className="flex-1"
                />
                {appliedCoupon?.valid ? (
                  <Button
                    variant="outline"
                    onClick={handleRemoveCoupon}
                    disabled={isValidatingCoupon}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                  >
                    {isValidatingCoupon ? "..." : "Apply"}
                  </Button>
                )}
              </div>
              {appliedCoupon?.valid && (
                <p className="text-xs text-green-600 font-medium">
                  Coupon applied! Save ₹{appliedCoupon.discountAmount}
                </p>
              )}
            </div>

            <Button
              onClick={() => onPurchase(appliedCoupon?.valid ? couponCode.trim() : undefined)}
              disabled={isPurchaseLoading}
              className="w-full"
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
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
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
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
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
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
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
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
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
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
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

        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-600">
            <strong>100% satisfaction guaranteed</strong>
            <br />
            30-day money-back policy
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
