"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  ArrowRight,
  Loader2,
  Linkedin,
  CheckCircle,
  X,
} from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

interface Mentor {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio?: string;
  link?: string;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  whatIncluded: string[];
  isDefault: boolean;
}

interface Addon {
  id: string;
  name: string;
  priceDelta: number;
  description: string;
}

interface CohortData {
  id: string;
  title: string;
  slug: string;
  badge1: string;
  badge2: string;
  subtitle: string;
  coverImageUrl: string;
  mentorsHeading: string;
  mentorsLinkTarget: string;
  mentorsLimit: number;
  featuresHeading: string;
  investmentLabel: string;
  basePrice: number;
  toolkitId?: string | null;
  hasAccess?: boolean;
  mentors: Mentor[];
  features: Feature[];
  tiers: Tier[];
  addons: Addon[];
}

export default function CohortLandingPage() {
  const params = useParams();
  const router = useRouter();
  const cohortId = params.id as string;
  const { data: session, isPending: sessionPending } = useSession();

  const [cohort, setCohort] = useState<CohortData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllMentors, setShowAllMentors] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Promo Code / Discounting state
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);

  // Upsell Modal / Bottom Sheet selections
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // Load Cohort details
  useEffect(() => {
    const fetchCohortDetails = async () => {
      try {
        const response = await axios.get(`/api/cohorts/${cohortId}`);
        const data = response.data;
        setCohort(data);
        
        // Auto-select default tier
        const defaultTier = data.tiers?.find((t: Tier) => t.isDefault) || data.tiers?.[0];
        if (defaultTier) {
          setSelectedTierId(defaultTier.id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load cohort details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCohortDetails();
  }, [cohortId]);

  // Sync buyer info with session once loaded
  useEffect(() => {
    if (session?.user) {
      setBuyerName(session.user.name || "");
      setBuyerEmail(session.user.email || "");
    }
  }, [session]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const response = await axios.post("/api/coupons/validate", {
        code: couponCode.trim(),
        cohortId: cohort?.id,
      });
      const data = response.data;
      if (data.valid) {
        setAppliedCoupon(data);
        toast.success(`Coupon applied! ₹${data.discountAmount} off`);
      } else {
        setAppliedCoupon(null);
        toast.error(data.error || "Invalid coupon code");
      }
    } catch (err) {
      console.error(err);
      setAppliedCoupon(null);
      toast.error("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
  };

  if (isLoading || sessionPending) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff5e14] mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Loading cohort experience...</p>
        </div>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold font-serif text-gray-900">Program Not Found</h2>
          <p className="text-gray-600">The cohort program you&apos;re trying to view might have ended or is no longer available.</p>
          <button
            onClick={() => router.push("/toolkit")}
            className="bg-black hover:bg-neutral-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Back to Toolkit
          </button>
        </div>
      </div>
    );
  }

  // Calculate prices dynamically
  const activeTier = cohort.tiers?.find((t) => t.id === selectedTierId);
  const basePrice = activeTier ? activeTier.price : cohort.basePrice;
  const addonsTotal = cohort.addons
    ?.filter((a) => selectedAddonIds.includes(a.id))
    .reduce((acc, current) => acc + current.priceDelta, 0) || 0;
  const subtotal = basePrice + addonsTotal;
  const discount = appliedCoupon?.valid ? appliedCoupon.discountAmount : 0;
  const runningTotal = Math.max(0, subtotal - discount);

  // Render mentors showing up to limit
  const visibleMentors = showAllMentors
    ? cohort.mentors
    : cohort.mentors?.slice(0, cohort.mentorsLimit || 4);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Razorpay Checkout handler
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please login to register for this cohort");
      router.push(`/login?returnUrl=%2Ftoolkit%2Fcohorts%2F${cohortId}`);
      return;
    }

    if (!buyerName || !buyerEmail) {
      toast.error("Please fill in your name and email");
      return;
    }

    setIsProcessingCheckout(true);
    try {
      // 1. Call backend to create order or verify free access
      const response = await axios.post(`/api/cohorts/${cohort.id}/checkout`, {
        selectedTierId,
        selectedAddOnIds: selectedAddonIds,
        buyerName,
        buyerEmail,
        buyerPhone,
        couponCode: appliedCoupon?.valid ? couponCode.toUpperCase().trim() : undefined,
      });

      if (response.data.free) {
        toast.success("Registration Successful! Welcome to the cohort.");
        setIsDrawerOpen(false);
        if (cohort.toolkitId) {
          router.push(`/toolkit/${cohort.toolkitId}/content`);
        } else {
          router.push("/toolkit");
        }
        setIsProcessingCheckout(false);
        return;
      }

      // 2. Load Razorpay script
      const scriptLoaded = await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        toast.error("Failed to load payment portal. Check your connection.");
        setIsProcessingCheckout(false);
        return;
      }

      const { order } = response.data;

      // 3. Open Razorpay Widget
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Rn3176vtFZ2Fvi",
        amount: order.amount,
        currency: order.currency,
        name: "Fire In The Belly",
        description: cohort.title,
        order_id: order.id,
        handler: async function (razorpayResponse: any) {
          setIsProcessingCheckout(true);
          try {
            // 4. Verify payment server-side
            const verifyRes = await axios.post(`/api/cohorts/${cohort.id}/checkout/verify`, {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success("Registration Successful! Welcome to the cohort.");
              setIsDrawerOpen(false);
              if (cohort.toolkitId) {
                router.push(`/toolkit/${cohort.toolkitId}/content`);
              } else {
                router.push("/toolkit");
              }
            } else {
              toast.error("Payment verification failed");
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            toast.error("Failed to verify payment. Please contact support.");
          } finally {
            setIsProcessingCheckout(false);
          }
        },
        prefill: {
          name: buyerName,
          email: buyerEmail,
          contact: buyerPhone,
        },
        theme: {
          color: "#ff5e14",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingCheckout(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Checkout initiation failed");
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] pb-24 font-sans antialiased">
      {/* 1. Hero Section */}
      <section className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden flex items-end">
        {cohort.coverImageUrl ? (
          <img
            src={cohort.coverImageUrl}
            alt={cohort.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#EFECE6]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="relative w-full max-w-lg md:max-w-3xl mx-auto px-4 py-8 md:py-16 text-white space-y-4">
          {/* Badge Pills */}
          <div className="flex gap-2">
            {cohort.badge1 && (
              <span className="bg-[#ff5e14] text-white text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                {cohort.badge1}
              </span>
            )}
            {cohort.badge2 && (
              <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                {cohort.badge2}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-serif tracking-tight leading-tight">
            {cohort.title}
          </h1>

          <p className="text-sm md:text-base text-gray-200 font-medium leading-relaxed max-w-xl">
            {cohort.subtitle}
          </p>
        </div>
      </section>

      {/* Main Responsive Grid Container */}
      <main className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* 2. Meet Your Mentors Section */}
        {cohort.mentors && cohort.mentors.length > 0 && (
          <section className="space-y-6">
            <div className="flex justify-between items-baseline">
              <h2 className="text-xl md:text-2xl font-black font-serif tracking-tight text-gray-900 border-b-2 border-black pb-1">
                {cohort.mentorsHeading || "Meet Your Mentors"}
              </h2>
              {cohort.mentors.length > (cohort.mentorsLimit || 4) && !showAllMentors && (
                <button
                  onClick={() => setShowAllMentors(true)}
                  className="text-xs md:text-sm font-bold text-[#ff5e14] hover:underline flex items-center gap-0.5"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visibleMentors?.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-white rounded-xl border border-gray-150 p-4 text-center hover:shadow-sm transition flex flex-col justify-between items-center"
                >
                  <div className="flex flex-col items-center space-y-3">
                    {mentor.imageUrl ? (
                      <img
                        src={mentor.imageUrl}
                        alt={mentor.name}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                        <Linkedin className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                        {mentor.name}
                      </h3>
                      <p className="text-[10px] md:text-xs text-[#ff5e14] font-semibold uppercase tracking-wider mt-0.5">
                        {mentor.role}
                      </p>
                    </div>
                  </div>
                  {mentor.link && (
                    <a
                      href={mentor.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-700 text-xs mt-3 flex items-center gap-0.5 font-medium border-t border-gray-100 w-full justify-center pt-2"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-blue-700" /> profile
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. What You Get Section */}
        {cohort.features && cohort.features.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black font-serif tracking-tight text-gray-900 border-b-2 border-black pb-1 inline-block">
              {cohort.featuresHeading || "What You Get"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cohort.features.map((feature) => (
                <div
                  key={feature.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start shadow-sm hover:shadow transition"
                >
                  <div className="bg-orange-50 text-[#ff5e14] p-2.5 rounded-full shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-sm md:text-base">
                      {feature.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 4. Sticky Bottom Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 py-3.5 px-4 shadow-xl z-30">
        <div className="max-w-md md:max-w-lg mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {cohort.investmentLabel || "Total Investment"}
            </span>
            <span className="font-black text-gray-900 text-xl md:text-2xl">
              ₹{cohort.basePrice}
            </span>
          </div>

          {cohort.hasAccess ? (
            <button
              onClick={() => {
                if (cohort.toolkitId) {
                  router.push(`/toolkit/${cohort.toolkitId}/content`);
                } else {
                  toast.success("You are registered! Check your dashboard for schedules.");
                }
              }}
              className="bg-green-600 hover:bg-green-750 text-white font-bold text-sm md:text-base py-3 px-6 rounded-xl transition shadow-lg flex items-center gap-1.5"
            >
              Access Content <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="bg-[#ff5e14] hover:bg-[#e04f0f] text-white font-bold text-sm md:text-base py-3 px-6 rounded-xl transition shadow-lg shadow-orange-500/10 flex items-center gap-1.5"
            >
              Apply Now <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>

      {/* Upsell Bottom Sheet (using custom Radix dialog mapping for ease & clean styles) */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[20px] h-[85vh] fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center shrink-0">
              <div>
                <Drawer.Title className="text-base font-bold font-serif">Select Your Cohort Plan</Drawer.Title>
                <Drawer.Description className="text-xs text-gray-500">Pick packages & optional career add-ons</Drawer.Description>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Tiers/Bundles Selection */}
              {cohort.tiers && cohort.tiers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Choose a Bundle Tier</h4>
                  <div className="space-y-2">
                    {cohort.tiers.map((tier) => {
                      const isSelected = selectedTierId === tier.id;
                      return (
                        <div
                          key={tier.id}
                          onClick={() => setSelectedTierId(tier.id)}
                          className={cn(
                            "border-2 rounded-xl p-4 cursor-pointer transition flex justify-between items-start",
                            isSelected
                              ? "border-[#ff5e14] bg-orange-50/20"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-gray-900">{tier.name}</h5>
                              {tier.isDefault && (
                                <span className="bg-orange-100 text-[#ff5e14] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{tier.description}</p>
                            {tier.whatIncluded && tier.whatIncluded.length > 0 && (
                              <ul className="text-[10px] text-gray-400 space-y-0.5 pt-1.5">
                                {tier.whatIncluded.map((inc, i) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <Check className="w-3 h-3 text-[#ff5e14]" /> {inc}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <span className="font-bold text-sm text-[#ff5e14]">₹{tier.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-ons Selection */}
              {cohort.addons && cohort.addons.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enhance Your Experience (Add-ons)</h4>
                  <div className="space-y-2">
                    {cohort.addons.map((addon) => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={cn(
                            "border-2 rounded-xl p-3.5 cursor-pointer transition flex items-center justify-between",
                            isSelected
                              ? "border-[#ff5e14] bg-orange-50/10"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          )}
                        >
                          <div className="flex gap-3 items-start">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // toggled by parent div
                              className="rounded border-gray-300 text-[#ff5e14] focus:ring-[#ff5e14] mt-0.5 h-4 w-4"
                            />
                            <div>
                              <h5 className="font-bold text-xs text-gray-900">{addon.name}</h5>
                              <p className="text-[10px] text-gray-500">{addon.description}</p>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-[#ff5e14] whitespace-nowrap">+ ₹{addon.priceDelta}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Discount / Coupon System */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Promo Code</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isValidatingCoupon) {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    disabled={isValidatingCoupon || !!appliedCoupon?.valid}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm uppercase"
                  />
                  {appliedCoupon?.valid ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isValidatingCoupon ? "..." : "Apply"}
                    </button>
                  )}
                </div>
                {appliedCoupon?.valid && (
                  <p className="text-xs font-medium text-green-600">
                    Coupon applied! Save ₹{appliedCoupon.discountAmount}
                  </p>
                )}
              </div>

              {/* Buyer Contact info */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Your Name</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Enter name"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="Enter email"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number (WhatsApp Preferred)</label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="e.g. +91 9999999999"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Checkout Action */}
            <div className="p-4 bg-gray-50 border-t flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 font-bold uppercase">Payable Price</span>
                <span className="font-black text-gray-900 text-lg">₹{runningTotal}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessingCheckout}
                className="bg-black hover:bg-neutral-800 text-white font-bold text-xs py-3 px-6 rounded-xl transition flex items-center gap-1.5 shadow"
              >
                {isProcessingCheckout ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Confirm & Checkout <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
