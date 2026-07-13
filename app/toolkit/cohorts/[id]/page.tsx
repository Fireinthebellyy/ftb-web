/* eslint-disable max-lines */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Loader2,
  Linkedin,
  CheckCircle,
  X,
  Gift,
  Copy,
} from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { extractRichTextPlainText } from "@/lib/rich-text";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StackedTestimonials } from "@/components/toolkit/StackedTestimonials";

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
  cardImageUrl?: string | null;
  startDate?: string | null;
  highlights?: string[] | null;
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
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Promo Code / Discounting state
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);

  // Upsell Modal / Bottom Sheet selections
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedToolkitIds, setSelectedToolkitIds] = useState<string[]>([]);
  const [liveToolkits, setLiveToolkits] = useState<any[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const redirectToRegistrationIfNeeded = useCallback(async () => {
    try {
      const response = await axios.get(`/api/cohorts/${cohortId}/registration`);
      if (!response.data.completed) {
        router.replace(`/toolkit/cohorts/${cohortId}/registration`);
      }
    } catch {
      // User has not paid yet — stay on cohort page
    }
  }, [cohortId, router]);

  // Buddy Program states
  const [isBuddyDialogOpen, setIsBuddyDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Cohort link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mentors stacked animation states
  const [mentorCards, setMentorCards] = useState<Mentor[]>([]);

  const rotateMentorsForward = () => {
    setMentorCards((prev) => {
      if (prev.length === 0) return prev;
      const newArray = [...prev];
      const first = newArray.shift();
      if (first) newArray.push(first);
      return newArray;
    });
  };

  const rotateMentorsBackward = () => {
    setMentorCards((prev) => {
      if (prev.length === 0) return prev;
      const newArray = [...prev];
      const last = newArray.pop();
      if (last) newArray.unshift(last);
      return newArray;
    });
  };

  // Load Cohort details and live toolkits
  useEffect(() => {
    const fetchCohortDetails = async () => {
      try {
        const response = await axios.get(`/api/cohorts/${cohortId}`);
        const data = response.data;
        setCohort(data);
        if (data.mentors && data.mentors.length > 0) {
          setMentorCards(data.mentors);
        }
        
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

    const fetchLiveToolkits = async () => {
      try {
        const response = await axios.get("/api/toolkits");
        setLiveToolkits(response.data);
      } catch (err) {
        console.error("Failed to load toolkits", err);
      }
    };

    fetchCohortDetails();
    fetchLiveToolkits();
  }, [cohortId]);

  useEffect(() => {
    if (!session || sessionPending || isLoading) {
      return;
    }

    redirectToRegistrationIfNeeded();
  }, [session, sessionPending, isLoading, redirectToRegistrationIfNeeded]);

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
          <h2 className="text-2xl font-bold text-gray-900">Program Not Found</h2>
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
  const basePrice = activeTier ? activeTier.price : 0;
  const sessionsTotal = cohort.addons
    ?.filter((a) => selectedAddonIds.includes(a.id))
    .reduce((acc, current) => acc + current.priceDelta, 0) || 0;
  const toolkitsTotal = liveToolkits
    ?.filter((t) => selectedToolkitIds.includes(t.id))
    .reduce((acc, current) => acc + current.price, 0) || 0;
  const subtotal = basePrice + sessionsTotal + toolkitsTotal;
  const discount = appliedCoupon?.valid ? appliedCoupon.discountAmount : 0;
  const runningTotal = Math.max(0, subtotal - discount);


  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => {
      const isSelected = prev.includes(addonId);
      if (!isSelected) {
        // Clear bundle tier (VIP/Default plans) when choosing individual sessions
        setSelectedTierId("");
        return [...prev, addonId];
      } else {
        return prev.filter((id) => id !== addonId);
      }
    });
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
        selectedTierId: selectedTierId || null,
        selectedAddOnIds: selectedAddonIds,
        selectedToolkitIds: selectedToolkitIds,
        buyerName,
        buyerEmail,
        buyerPhone,
        couponCode: appliedCoupon?.valid ? couponCode.toUpperCase().trim() : undefined,
      });

      if (response.data.free) {
        toast.success("Registration Successful! Welcome to the cohort.");
        setIsDrawerOpen(false);
        router.push(`/toolkit/cohorts/${cohortId}/registration`);
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
              router.push(`/toolkit/cohorts/${cohortId}/registration`);
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

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
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
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 border-b-2 border-black pb-1">
                {cohort.mentorsHeading || "Meet Your Mentors"}
              </h2>
            </div>

            {mentorCards.length >= 3 ? (
              <div className="flex flex-col items-center w-full">
                <div className="relative h-[300px] sm:h-[340px] w-full mx-auto flex items-center justify-center overflow-hidden py-4">
                  {mentorCards.map((mentor, index) => {
                    const isCenter = index === 0;
                    const isRight = index === 1;
                    const isLeft = index === mentorCards.length - 1;

                    let animateState = { x: "0%", scale: 0.7, opacity: 0, zIndex: 0 };

                    if (isCenter) {
                      animateState = { x: "0%", scale: 1, opacity: 1, zIndex: 10 };
                    } else if (isRight) {
                      animateState = { x: "68%", scale: 0.85, opacity: 1, zIndex: 5 };
                    } else if (isLeft) {
                      animateState = { x: "-68%", scale: 0.85, opacity: 1, zIndex: 5 };
                    }

                    return (
                      <motion.div
                        key={mentor.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={animateState}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        onClick={rotateMentorsForward}
                        className={cn(
                          "absolute w-[260px] h-[200px] sm:w-[320px] sm:h-[240px] rounded-2xl shadow-lg border border-gray-100 bg-white p-4 flex flex-col justify-between items-center text-center cursor-pointer transition-shadow hover:shadow-md",
                          isCenter ? "" : "pointer-events-none md:pointer-events-auto"
                        )}
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
                          <div className="space-y-1">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                              {mentor.name}
                            </h3>
                            <p className="text-[10px] md:text-xs text-[#ff5e14] font-semibold uppercase tracking-wider">
                              {mentor.role}
                            </p>
                            {mentor.bio && (
                              <p className="text-[11px] md:text-xs text-gray-500 line-clamp-2 leading-relaxed max-w-[240px] mx-auto mt-1">
                                {mentor.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        {mentor.link && isCenter && (
                          <a
                            href={mentor.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-700 text-xs mt-3 flex items-center gap-0.5 font-medium border-t border-gray-100 w-full justify-center pt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Linkedin className="w-3.5 h-3.5 text-blue-700" /> profile
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 mt-2">
                  <button
                    onClick={rotateMentorsBackward}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                    aria-label="Previous mentor"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs text-gray-400 font-medium">
                    Tap card or use arrows to rotate
                  </span>
                  <button
                    onClick={rotateMentorsForward}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                    aria-label="Next mentor"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Fallback Grid for less than 3 mentors */
              <div className="grid grid-cols-2 gap-4 justify-center max-w-lg mx-auto">
                {mentorCards.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="bg-white rounded-xl border border-gray-150 p-4 text-center flex flex-col justify-between items-center"
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
                       <div className="space-y-1">
                        <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                          {mentor.name}
                        </h3>
                        <p className="text-[10px] md:text-xs text-[#ff5e14] font-semibold uppercase tracking-wider">
                          {mentor.role}
                        </p>
                        {mentor.bio && (
                          <p className="text-[11px] md:text-xs text-gray-500 line-clamp-2 leading-relaxed max-w-[240px] mx-auto mt-1">
                            {mentor.bio}
                          </p>
                        )}
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
            )}
          </section>
        )}

        {/* 3. What You Get Section */}
        {cohort.features && cohort.features.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 border-b-2 border-black pb-1 inline-block">
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

        {/* Cohort Curriculum / Sessions Section */}
        {cohort.addons && cohort.addons.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 border-b-2 border-black pb-1 inline-block">
              Cohort Sessions & Curriculum
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cohort.addons.map((session, index) => (
                <div
                  key={session.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start shadow-sm hover:shadow transition"
                >
                  <div className="bg-orange-50 text-[#ff5e14] px-3 py-1.5 rounded-lg shrink-0 font-bold text-xs md:text-sm whitespace-nowrap">
                    Session {index + 1}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-gray-900 text-sm md:text-base leading-snug">
                        {session.name}
                      </h3>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                      {session.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Buddy Program Referral Card */}
        <section className="bg-gradient-to-r from-orange-500 to-[#ff5e14] rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" /> Buddy Program
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
              Refer your buddy & enjoy together!
            </h2>
            <p className="text-xs md:text-sm text-orange-50/95 max-w-md leading-relaxed">
              Learn, build, and level up with your friends. Share the access and experience the cohort together.
            </p>
          </div>
          <button
            onClick={() => setIsBuddyDialogOpen(true)}
            className="w-full md:w-auto bg-white hover:bg-neutral-100 text-[#ff5e14] font-bold text-xs md:text-sm py-3 px-6 rounded-xl transition shadow-md whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
          >
            Invite Buddy Now
          </button>
        </section>

        {/* Testimonials Section */}
        <section className="space-y-6 pt-6">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 border-b-2 border-black pb-1 inline-block">
            What Members Say About Our Ecosystem
          </h2>
          <StackedTestimonials />
        </section>
      </main>

      {/* 4. Sticky Bottom Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 py-3.5 px-4 shadow-xl z-30">
        <div className="max-w-md md:max-w-lg mx-auto flex gap-3 items-center justify-between">
          <a
            href={`https://wa.me/916377492042?text=Hi!%20I'd%20like%20to%20enquire%20about%20the%20cohort%20program:%20${encodeURIComponent(cohort.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm md:text-base py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
          >
            Enquire Now
          </a>

          {cohort.hasAccess ? (
            <button
              onClick={() => {
                if (cohort.toolkitId) {
                  router.push(`/toolkit/${cohort.toolkitId}/content`);
                } else {
                  // Redirect to cohort dashboard if no toolkit id
                  router.push(`/toolkit/cohorts/${cohortId}/dashboard`);
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-750 text-white font-bold text-sm md:text-base py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
            >
              Access Content <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex-1 bg-[#ff5e14] hover:bg-[#e04f0f] text-white font-bold text-sm md:text-base py-3 px-4 rounded-xl transition shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5"
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
                <Drawer.Title className="text-base font-bold">Select Your Cohort Plan</Drawer.Title>
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
                          onClick={() => {
                            setSelectedTierId(tier.id);
                            setSelectedAddonIds([]);
                          }}
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
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-sm text-[#ff5e14]">₹{tier.price}</span>
                            {(tier as any).originalPrice && (tier as any).originalPrice > tier.price && (
                              <span className="line-through text-gray-400 text-xs mt-0.5">₹{(tier as any).originalPrice}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-ons Selection (Individual Sessions) */}
              {cohort.addons && cohort.addons.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Individual Sessions</h4>
                    <p className="text-[10px] text-gray-500">Choosing an individual session will deselect the bundle tier.</p>
                  </div>
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

              {/* Toolkit Add-ons Selection */}
              {liveToolkits && liveToolkits.filter(t => t.id !== cohort.toolkitId).length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Add Toolkits (Optional Add-ons)</h4>
                    <p className="text-[10px] text-gray-500">Get additional live toolkits to enhance your career toolkit library.</p>
                  </div>
                  <div className="space-y-2">
                    {liveToolkits.filter(t => t.id !== cohort.toolkitId).map((tk) => {
                      const isSelected = selectedToolkitIds.includes(tk.id);
                      return (
                        <div
                          key={tk.id}
                          onClick={() => {
                            setSelectedToolkitIds(prev =>
                              prev.includes(tk.id) ? prev.filter(id => id !== tk.id) : [...prev, tk.id]
                            );
                          }}
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
                              <h5 className="font-bold text-xs text-gray-900">{tk.title}</h5>
                              <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">
                                {extractRichTextPlainText(tk.description || tk.subtitle)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-[#ff5e14] whitespace-nowrap">+ ₹{tk.price}</span>
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

      {/* Buddy Program Dialog */}
      <Dialog open={isBuddyDialogOpen} onOpenChange={setIsBuddyDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -z-10 translate-x-8 -translate-y-8" />
          
          <DialogHeader className="space-y-3 text-center flex flex-col items-center">
            <span className="bg-orange-50 text-[#ff5e14] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-orange-100">
              Buddy Benefit
            </span>
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 text-[#ff5e14] p-3.5 rounded-2xl w-fit shadow-inner">
              <Gift className="w-6 h-6 animate-bounce" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-gray-900 leading-tight">
              Enjoy Cohort with a Friend!
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 max-w-sm leading-relaxed text-center">
              Share the experience, collaborate on cohort assignments, and build together. Copy the link below or send it directly via WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Cohort Share Link
              </label>
              <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 items-center focus-within:ring-2 focus-within:ring-[#ff5e14]/20 transition-all">
                <span className="text-xs text-gray-600 truncate flex-1 pl-2 font-medium select-all">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition duration-200 shrink-0 flex items-center gap-1.5 shadow"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-300" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share to WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Hey! I was checking out this amazing cohort program: "${cohort?.title}". Let's apply and do it together! Check it out here: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 px-4 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.588 1.978 14.12 .952 11.998.951 6.559.951 2.134 5.325 2.13 10.756c-.001 1.674.444 3.308 1.292 4.773L2.4 20.803l5.35-1.393c.001-.001.002-.001.003-.002z" />
              </svg>
              Share via WhatsApp
            </a>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsBuddyDialogOpen(false)}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-3 rounded-2xl transition duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsBuddyDialogOpen(false);
                setIsDrawerOpen(true);
              }}
              className="flex-1 bg-gradient-to-r from-[#ff5e14] to-[#ff7a3d] hover:from-[#e04f0f] hover:to-[#ff5e14] text-white font-bold text-xs py-3 rounded-2xl transition duration-200 shadow-md hover:shadow-lg transform active:scale-95"
            >
              Apply Now
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
