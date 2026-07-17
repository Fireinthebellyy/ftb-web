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
import { motion, AnimatePresence } from "framer-motion";
import { StackedTestimonials } from "@/components/toolkit/StackedTestimonials";
import ToolkitStudentFeedback from "@/components/toolkit/ToolkitStudentFeedback";

export function getDuoPricing(singlePrice: number) {
  if (!singlePrice || singlePrice <= 0) {
    return { reference: 0, final: 0, perHead: 0 };
  }
  const raw_duo = singlePrice * 2;
  const reference = Math.ceil((raw_duo + 1) / 100) * 100 - 1;
  const final = Math.round((reference * 0.8) / 10) * 10 - 1;
  const perHead = Math.round(final / 2);
  return { reference, final, perHead };
}

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
  originalPrice?: number | null;
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

interface Session {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  originalPrice?: number | null;
}

interface CohortData {
  id: string;
  title: string;
  slug: string;
  badge1: string;
  badge2: string;
  subtitle: string;
  coverImageUrl: string;
  coverImageUrls?: string[] | null;
  cardImageUrl?: string | null;
  startDate?: string | null;
  highlights?: string[] | null;
  mentorsHeading: string;
  mentorsLinkTarget: string;
  mentorsLimit: number;
  featuresHeading: string;
  sessionsHeading?: string | null;
  testimonialsHeading?: string | null;
  whoIsThisForHeading?: string | null;
  whoIsThisForBullets?: string[] | null;
  investmentLabel: string;
  basePrice: number;
  hasEarlyBird?: boolean;
  showEarlyBirdCheckout?: boolean;
  showEarlyBirdMarqueeCheckout?: boolean;
  showAddonsCheckout?: boolean;
  toolkitId?: string | null;
  hasAccess?: boolean;
  mentors: Mentor[];
  features: Feature[];
  tiers: Tier[];
  addons: Addon[];
  sessions: Session[];
}

export default function CohortLandingPage() {
  const params = useParams();
  const router = useRouter();
  const cohortId = params.id as string;
  const { data: session, isPending: sessionPending } = useSession();

  const [cohort, setCohort] = useState<CohortData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSeatsPop, setShowSeatsPop] = useState(false);

  // Upsell Modal / Bottom Sheet selections
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedToolkitIds, setSelectedToolkitIds] = useState<string[]>([]);
  const [liveToolkits, setLiveToolkits] = useState<any[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buddyEmail, setBuddyEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Clear coupon when cart dependencies change
  useEffect(() => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponError("");
    setIsApplyingCoupon(false);
  }, [selectedTierId, selectedAddonIds, buddyEmail]);

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

  // Cover Image Carousel states
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!cohort || !cohort.coverImageUrls || cohort.coverImageUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % cohort.coverImageUrls.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [cohort]);

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



  if (isLoading || sessionPending) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff5e14] mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Saath milke phodoge? Lessgooo...</p>
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
  const isDuoActive = buddyEmail.trim().length > 0;
  const activeTier = cohort.tiers?.find((t) => t.id === selectedTierId);
  const basePrice = activeTier ? activeTier.price : 0;
  // Duo: double the current price, then apply 20% off the combined total
  const finalBasePrice = isDuoActive ? getDuoPricing(basePrice).final : basePrice;

  const sessionsTotal = cohort.sessions
    ?.filter((s) => s.price && selectedAddonIds.includes(s.id))
    .reduce((acc, current) => acc + (current.price || 0), 0) || 0;
  const finalSessionsTotal = isDuoActive ? getDuoPricing(sessionsTotal).final : sessionsTotal;

  const toolkitsTotal = liveToolkits
    ?.filter((t) => selectedToolkitIds.includes(t.id))
    .reduce((acc, current) => acc + current.price, 0) || 0;

  const subtotal = finalBasePrice + finalSessionsTotal + toolkitsTotal;
  const runningTotal = Math.max(0, subtotal - couponDiscount);

  const baseOriginalPrice = activeTier ? (activeTier.originalPrice || activeTier.price) : 0;
  const sessionsOriginalTotal = cohort.sessions
    ?.filter((s) => s.price && selectedAddonIds.includes(s.id))
    .reduce((acc, current) => acc + (current.originalPrice || current.price || 0), 0) || 0;
  const totalOriginalPrice = baseOriginalPrice + sessionsOriginalTotal + toolkitsTotal;


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
    setIsProcessingCheckout(true);

    if (!session) {
      toast.error("Please login to register for this cohort");
      router.push(`/login?returnUrl=%2Ftoolkit%2Fcohorts%2F${cohortId}`);
      setIsProcessingCheckout(false);
      return;
    }

    if (!buyerName || !buyerEmail) {
      toast.error("Please fill in your name and email");
      setIsProcessingCheckout(false);
      return;
    }

    // If coupon code is entered, validate it before checkout
    if (couponCode.trim()) {
      setIsApplyingCoupon(true);
      try {
        const validateResponse = await axios.post(`/api/cohorts/${cohort.id}/checkout`, {
          selectedTierId: selectedTierId || null,
          selectedAddOnIds: selectedAddonIds,
          selectedToolkitIds: selectedToolkitIds,
          buyerName,
          buyerEmail,
          buyerPhone: "",
          buddyEmail: buddyEmail || null,
          couponCode: couponCode.trim(),
          validateCouponOnly: true,
        });
        if (validateResponse.data.discountAmount) {
          setCouponDiscount(validateResponse.data.discountAmount);
        } else {
          toast.error("Invalid or expired coupon");
          setCouponCode("");
          setCouponDiscount(0);
          setIsApplyingCoupon(false);
          setIsProcessingCheckout(false);
          return;
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Invalid coupon");
        setCouponCode("");
        setCouponDiscount(0);
        setIsApplyingCoupon(false);
        setIsProcessingCheckout(false);
        return;
      } finally {
        setIsApplyingCoupon(false);
      }
    }

    try {
      // 1. Call backend to create order or verify free access
      const response = await axios.post(`/api/cohorts/${cohort.id}/checkout`, {
        selectedTierId: selectedTierId || null,
        selectedAddOnIds: selectedAddonIds,
        selectedToolkitIds: selectedToolkitIds,
        buyerName,
        buyerEmail,
        buyerPhone: "",
        buddyEmail: buddyEmail || null,
        couponCode: couponCode || null,
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

      const razorpayKey = response.data.key;
      if (!razorpayKey) {
        toast.error("Payment configuration error. Please contact support.");
        setIsProcessingCheckout(false);
        return;
      }

      // 3. Open Razorpay Widget
      const options = {
        key: razorpayKey,
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
          contact: "",
        },
        theme: {
          color: "#ff5e14",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingCheckout(false);
            // Re-open the drawer so the user can adjust selections and retry
            setIsDrawerOpen(true);
            toast.info("Payment cancelled");
          },
        },
      };

      // Close the drawer BEFORE opening Razorpay so its overlay doesn't
      // block interaction with the payment popup (rage-click fix).
      setIsDrawerOpen(false);
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
      {/* Marquee Banner */}
      {cohort.hasEarlyBird && (
        <div className="w-full bg-[#ff5e14] text-white py-2.5 overflow-hidden relative font-extrabold text-[10px] sm:text-xs uppercase tracking-widest border-b border-orange-600/20 shadow-sm select-none shrink-0 z-30">
          <div className="marquee-container flex">
            <div className="animate-marquee flex whitespace-nowrap gap-8">
              {Array(10).fill("Early Bird Offer!! 🔥 Get 20% off with Buddy Referral").map((text, i) => (
                <span key={i} className="flex items-center gap-4 shrink-0">
                  <span>{text}</span>
                  <span className="text-orange-300 font-black">•</span>
                </span>
              ))}
            </div>
            <div className="animate-marquee flex whitespace-nowrap gap-8" aria-hidden="true">
              {Array(10).fill("Early Bird Offer!! 🔥 Get 20% off with Buddy Referral").map((text, i) => (
                <span key={i} className="flex items-center gap-4 shrink-0">
                  <span>{text}</span>
                  <span className="text-orange-300 font-black">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden flex items-end">
        {cohort.coverImageUrls && cohort.coverImageUrls.length > 0 ? (
          <div className="absolute inset-0 w-full h-full">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide}
                src={cohort.coverImageUrls[currentSlide]}
                alt={`${cohort.title} slide ${currentSlide + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Carousel navigation arrows */}
            {cohort.coverImageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      prev === 0 ? cohort.coverImageUrls!.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition duration-200"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      (prev + 1) % cohort.coverImageUrls!.length
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition duration-200"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                  {cohort.coverImageUrls.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        idx === currentSlide ? "bg-white w-4" : "bg-white/50"
                      )}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : cohort.coverImageUrl ? (
          <img
            src={cohort.coverImageUrl}
            alt={cohort.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#EFECE6]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Back navigation button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/toolkit");
            }
          }}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-semibold px-3 py-2 rounded-full backdrop-blur-sm transition duration-200 group"
          aria-label="Go back"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className="relative w-full max-w-lg md:max-w-3xl mx-auto px-4 py-8 md:py-16 text-white space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {cohort.title}
          </h1>
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
                <div className="relative h-[340px] sm:h-[380px] w-full mx-auto flex items-center justify-center overflow-hidden py-4">
                  {/* Side Arrows */}
                  <button
                    onClick={rotateMentorsBackward}
                    className="absolute left-2 sm:left-6 md:left-12 z-20 p-2.5 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 shadow-md border border-blue-200 text-blue-600 hover:text-blue-800 hover:shadow-lg transition-all active:scale-95"
                    aria-label="Previous mentor"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {mentorCards.map((mentor, index) => {
                    const isCenter = index === 0;
                    const isRight = index === 1;
                    const isLeft = index === mentorCards.length - 1;

                    let animateState = { x: "0%", scale: 0.7, opacity: 0, zIndex: 0 };

                    if (isCenter) {
                      animateState = { x: "0%", scale: 1, opacity: 1, zIndex: 10 };
                    } else if (isRight) {
                      animateState = { x: "68%", scale: 0.85, opacity: 0.9, zIndex: 5 };
                    } else if (isLeft) {
                      animateState = { x: "-68%", scale: 0.85, opacity: 0.9, zIndex: 5 };
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
                          "absolute w-[250px] min-h-[240px] sm:w-[310px] sm:min-h-[280px] rounded-2xl shadow-lg border border-gray-100 bg-white p-5 flex flex-col justify-between items-center text-center cursor-pointer transition-shadow hover:shadow-md",
                          isCenter ? "" : "pointer-events-none md:pointer-events-auto"
                        )}
                      >
                        <div className="flex flex-col items-center space-y-3 w-full">
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
                          <div className="space-y-1 w-full">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                              {mentor.name}
                            </h3>
                            <p className="text-[10px] md:text-xs text-[#ff5e14] font-semibold uppercase tracking-wider">
                              {mentor.role}
                            </p>
                            {mentor.bio && (
                              <div
                                className="w-full max-h-[72px] sm:max-h-[100px] overflow-y-auto pr-1 text-center scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed max-w-[240px] mx-auto mt-1">
                                  {mentor.bio}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {mentor.link && isCenter && (
                          <a
                            href={mentor.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-700 text-xs mt-3 flex items-center gap-0.5 font-medium border-t border-gray-100 w-full justify-center pt-2.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Linkedin className="w-3.5 h-3.5 text-blue-700" /> profile
                          </a>
                        )}
                      </motion.div>
                    );
                  })}

                  <button
                    onClick={rotateMentorsForward}
                    className="absolute right-2 sm:right-6 md:right-12 z-20 p-2.5 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 shadow-md border border-blue-200 text-blue-600 hover:text-blue-800 hover:shadow-lg transition-all active:scale-95"
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
                          <div className="w-full max-h-[60px] sm:max-h-[90px] overflow-y-auto pr-1 text-center scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed max-w-[240px] mx-auto mt-1">
                              {mentor.bio}
                            </p>
                          </div>
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

        {/* Cohort Curriculum / Sessions Section */}
        {cohort.sessions && cohort.sessions.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 border-b-2 border-black pb-1 inline-block">
              {cohort.sessionsHeading || "Cohort Sessions & Curriculum"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cohort.sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="relative overflow-hidden bg-white rounded-xl border border-gray-100 p-5 pt-7 flex gap-4 items-start shadow-sm hover:shadow transition"
                >
                  <div className="absolute top-0 right-0 z-10">
                    <span className="bg-[#ff5e14] text-white rounded-tr-none rounded-bl-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                      Session {index + 1}
                    </span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-gray-900 text-sm md:text-base leading-snug pr-16">
                        {session.title}
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

        {/* What You Get Section */}
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

        {/* Who Is This For Section */}
        {cohort.whoIsThisForBullets && cohort.whoIsThisForBullets.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 border-b-2 border-black pb-1 inline-block">
              {cohort.whoIsThisForHeading || "Who Is This For?"}
            </h2>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cohort.whoIsThisForBullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#ff5e14] text-xs font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-650 leading-relaxed text-justify">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Buddy Program Referral Card */}
        <section className="bg-gradient-to-r from-orange-500 to-[#ff5e14] rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" /> Buddy Program
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
              Enjoy Cohort with a friend &lt;3!
            </h2>
            <p className="text-xs md:text-sm text-orange-50/95 max-w-md leading-relaxed">
              We absolutely love ungatekeepers. So, here is something for you. Enroll with a friend - get straight up 20% off &amp; a partner to level up with (ek teer se do nishaane, lessgoo!)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsBuddyDialogOpen(true)}
            className="w-full md:w-auto bg-white hover:bg-neutral-100 text-[#ff5e14] font-bold text-xs md:text-sm py-3 px-6 rounded-xl transition shadow-md whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" />
            Invite Buddy Now
          </button>
        </section>

        {/* Buddy Program Modal - rendered outside section to avoid z-index/blur conflicts */}
        {isBuddyDialogOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsBuddyDialogOpen(false); }}
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-6 relative overflow-hidden">
              {/* Decorative blob */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10 pointer-events-none" />

              {/* Close X button */}
              <button
                type="button"
                onClick={() => setIsBuddyDialogOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-3 mb-6">
                <span className="bg-orange-50 text-[#ff5e14] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-orange-100">
                  Buddy Benefit
                </span>
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 text-[#ff5e14] p-3.5 rounded-2xl w-fit shadow-inner">
                  <Gift className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 leading-tight">
                  Enjoy Cohort with a friend &lt;3!
                </h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  We absolutely love ungatekeepers. So, here is something for you. Enroll with a friend - get straight up 20% off &amp; a partner to level up with (ek teer se do nishaane, lessgoo!)
                </p>
              </div>

              {/* Share link */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Cohort Share Link
                  </label>
                  <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 items-center">
                    <span className="text-xs text-gray-600 truncate flex-1 pl-2 font-medium select-all">
                      {typeof window !== "undefined" ? window.location.href : ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition duration-200 shrink-0 flex items-center gap-1.5 shadow"
                    >
                      {copied ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5 text-gray-300" /> Copy Link</>
                      )}
                    </button>
                  </div>
                </div>

                {/* WhatsApp Share */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hey! I was checking out this amazing cohort program: "${cohort?.title}". Let's apply and do it together! Check it out here: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 px-4 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.808 1.236h.005c5.505 0 9.99-4.477 9.99-9.985C22.005 6.478 17.518 2 12.012 2Zm5.845 14.285c-.244.686-1.42 1.328-1.948 1.41-.478.077-1.101.144-3.187-.723-2.667-1.108-4.37-3.816-4.502-3.992-.133-.176-1.077-1.43-1.077-2.729 0-1.298.679-1.937.922-2.202.244-.265.533-.332.71-.332.178 0 .356.006.51.013.162.008.38-.06.593.453.22.532.753 1.836.82 1.968.067.133.11.288.022.465-.088.177-.133.288-.266.443-.133.155-.28.347-.4.493-.133.16-.272.336-.117.6.155.265.686 1.132 1.47 1.831.99.885 1.823 1.157 2.08 1.288.254.133.403.11.553-.066.15-.177.643-.753.815-.996.172-.244.344-.2.58-.112.235.088 1.492.703 1.748.83.256.128.427.194.49.305.061.11.061.643-.183 1.329Z" />
                  </svg>
                  Share via WhatsApp
                </a>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBuddyDialogOpen(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-3 rounded-2xl transition duration-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBuddyDialogOpen(false);
                    setIsDrawerOpen(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-[#ff5e14] to-[#ff7a3d] hover:from-[#e04f0f] hover:to-[#ff5e14] text-white font-bold text-xs py-3 rounded-2xl transition duration-200 shadow-md hover:shadow-lg"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Testimonials Section */}
        <section className="space-y-6 pt-6">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 border-b-2 border-black pb-1 inline-block">
            {cohort.testimonialsHeading || "What Members Say About Our Ecosystem"}
          </h2>
          <StackedTestimonials />
          <div className="max-w-2xl mx-auto">
            <ToolkitStudentFeedback />
          </div>
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
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0 md:w-5 md:h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.808 1.236h.005c5.505 0 9.99-4.477 9.99-9.985C22.005 6.478 17.518 2 12.012 2Zm5.845 14.285c-.244.686-1.42 1.328-1.948 1.41-.478.077-1.101.144-3.187-.723-2.667-1.108-4.37-3.816-4.502-3.992-.133-.176-1.077-1.43-1.077-2.729 0-1.298.679-1.937.922-2.202.244-.265.533-.332.71-.332.178 0 .356.006.51.013.162.008.38-.06.593.453.22.532.753 1.836.82 1.968.067.133.11.288.022.465-.088.177-.133.288-.266.443-.133.155-.28.347-.4.493-.133.16-.272.336-.117.6.155.265.686 1.132 1.47 1.831.99.885 1.823 1.157 2.08 1.288.254.133.403.11.553-.066.15-.177.643-.753.815-.996.172-.244.344-.2.58-.112.235.088 1.492.703 1.748.83.256.128.427.194.49.305.061.11.061.643-.183 1.329Z" />
            </svg>
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
              Join Cohort <ChevronRight className="w-4 h-4" />
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
            {/* Drawer Marquee Banner */}
            {cohort.showEarlyBirdMarqueeCheckout && (
              <div className="w-full bg-black text-[#ff5e14] py-2 overflow-hidden relative font-extrabold text-[9px] uppercase tracking-widest select-none shrink-0 border-b border-gray-100">
                <div className="marquee-container flex">
                  <div className="animate-marquee flex whitespace-nowrap gap-8">
                    {Array(8).fill("Early Bird Offer!! 🔥 Get 20% off with Buddy Referral").map((text, i) => (
                      <span key={i} className="flex items-center gap-4 shrink-0">
                        <span>{text}</span>
                        <span className="text-neutral-800 font-black">•</span>
                      </span>
                    ))}
                  </div>
                  <div className="animate-marquee flex whitespace-nowrap gap-8" aria-hidden="true">
                    {Array(8).fill("Early Bird Offer!! 🔥 Get 20% off with Buddy Referral").map((text, i) => (
                      <span key={i} className="flex items-center gap-4 shrink-0">
                        <span>{text}</span>
                        <span className="text-neutral-800 font-black">•</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                            {isDuoActive ? (
                              <>
                                <span className="font-bold text-sm text-[#ff5e14]">₹{Math.round(tier.price * 0.8)}</span>
                                <span className="line-through text-gray-400 text-[10px]">₹{tier.price}</span>
                                <span className="text-[9px] text-emerald-600 font-medium whitespace-nowrap">≈ ₹{Math.round(tier.price * 0.8 / 2)}/head</span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-sm text-[#ff5e14]">₹{tier.price}</span>
                                {(tier as any).originalPrice && (tier as any).originalPrice > tier.price && (
                                  <span className="line-through text-gray-400 text-xs mt-0.5">₹{(tier as any).originalPrice}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-ons Selection (Individual Sessions) */}
              {cohort.sessions && cohort.sessions.filter(s => s.price && s.price > 0).length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Individual Sessions</h4>
                    <p className="text-[10px] text-gray-500">Choosing an individual session will deselect the bundle tier.</p>
                  </div>
                  <div className="space-y-2">
                    {cohort.sessions.filter(s => s.price && s.price > 0).map((session, index) => {
                      const isSelected = selectedAddonIds.includes(session.id);
                      return (
                        <div
                          key={session.id}
                          onClick={() => toggleAddon(session.id)}
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
                              <h5 className="font-bold text-xs text-gray-900">Session {index + 1}: {session.title}</h5>
                              <p className="text-[10px] text-gray-500">{session.description}</p>
                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            {isDuoActive ? (
                              <>
                                <span className="font-bold text-xs text-[#ff5e14] block">+ ₹{Math.round((session.price || 0) * 0.8)}</span>
                                <span className="line-through text-gray-400 text-[10px] block">₹{session.price}</span>
                                <span className="text-[9px] text-emerald-600 font-medium block">≈ ₹{Math.round((session.price || 0) * 0.8 / 2)}/head</span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-xs text-[#ff5e14] block">+ ₹{session.price}</span>
                                {session.originalPrice && session.originalPrice > (session.price || 0) && (
                                  <span className="line-through text-gray-400 text-[10px] block">₹{session.originalPrice}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toolkit Add-ons Selection */}
              {cohort.showAddonsCheckout !== false && liveToolkits && liveToolkits.filter(t => t.id !== cohort.toolkitId).length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Optional Add-Ons</h4>
                    <p className="text-[10px] text-gray-500">Get additional 1:1 services to level up your cohort experience</p>
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



              {/* Coupon Code */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Discount Coupon</h4>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                        setCouponDiscount(0);
                      }}
                      placeholder="Enter coupon code"
                      className="w-full px-3 py-2 pr-10 border rounded-lg text-sm uppercase"
                    />
                    {couponCode && (
                      <button
                        type="button"
                        onClick={() => {
                          setCouponCode("");
                          setCouponDiscount(0);
                          setCouponError("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!couponCode.trim()) {
                        setCouponError("Please enter a coupon code");
                        return;
                      }
                      setIsApplyingCoupon(true);
                      setCouponError("");
                      try {
                        const response = await axios.post(`/api/cohorts/${cohort.id}/checkout`, {
                          selectedTierId: selectedTierId || null,
                          selectedAddOnIds: selectedAddonIds,
                          selectedToolkitIds: selectedToolkitIds,
                          buyerName,
                          buyerEmail,
                          buyerPhone: "",
                          buddyEmail: buddyEmail || null,
                          couponCode: couponCode.trim(),
                          validateCouponOnly: true,
                        });
                        if (response.data.discountAmount) {
                          setCouponDiscount(response.data.discountAmount);
                          toast.success(`Coupon applied! ₹${response.data.discountAmount} discount`);
                        } else {
                          setCouponError("Invalid or expired coupon");
                          setCouponDiscount(0);
                        }
                      } catch (err: any) {
                        setCouponError(err.response?.data?.error || "Invalid coupon");
                        setCouponDiscount(0);
                      } finally {
                        setIsApplyingCoupon(false);
                      }
                    }}
                    disabled={isApplyingCoupon}
                    className="px-4 py-2 bg-[#ff5e14] text-white rounded-lg text-sm font-medium hover:bg-[#e04f0f] disabled:opacity-50"
                  >
                    {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                {couponDiscount > 0 && (
                  <p className="text-xs text-green-600 font-medium">Coupon applied: ₹{couponDiscount} discount</p>
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
                    <label className="text-[10px] font-bold text-[#ff5e14] uppercase tracking-wider flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Buddy Email Address (Optional Referral)
                    </label>
                    <input
                      type="email"
                      value={buddyEmail}
                      onChange={(e) => setBuddyEmail(e.target.value)}
                      placeholder="buddy@example.com (they will also get access)"
                      className="w-full px-3 py-2 border border-orange-100 focus:border-[#ff5e14] focus:ring-1 focus:ring-[#ff5e14] rounded-lg text-sm bg-orange-50/5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Checkout Action */}
            <div className="p-4 bg-gray-50 border-t flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 font-bold uppercase">Payable Price</span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-black text-gray-900 text-lg">₹{runningTotal}</span>
                  {couponDiscount > 0 && (
                    <>
                      <span className="line-through text-xs text-gray-400 font-medium">₹{subtotal}</span>
                      <span className="bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Coupon Applied
                      </span>
                    </>
                  )}
                  {cohort.showEarlyBirdCheckout && totalOriginalPrice > runningTotal && couponDiscount === 0 && (
                    <>
                      <span className="line-through text-xs text-gray-400 font-medium">₹{totalOriginalPrice}</span>
                      <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Early Bird offer
                      </span>
                    </>
                  )}
                  {!cohort.showEarlyBirdCheckout && isDuoActive && (selectedTierId || selectedAddonIds.length > 0) && couponDiscount === 0 && (
                    <span className="line-through text-xs text-gray-400 font-medium">₹{
                      selectedTierId ? basePrice * 2 + toolkitsTotal : sessionsTotal * 2 + toolkitsTotal
                    }</span>
                  )}
                </div>
                {isDuoActive && (selectedTierId || selectedAddonIds.length > 0) && (
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    ≈ ₹{Math.round((selectedTierId ? finalBasePrice : finalSessionsTotal) / 2) + Math.round(toolkitsTotal / 2)} per person (Duo Discount Applied)
                  </span>
                )}
                {!(selectedTierId || selectedAddonIds.length > 0) && (
                  <span className="text-[9px] text-red-500 font-semibold mt-0.5">Please select a tier or session</span>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessingCheckout || !(selectedTierId || selectedAddonIds.length > 0)}
                className="bg-black hover:bg-neutral-800 text-white font-bold text-xs py-3 px-6 rounded-xl transition flex items-center gap-1.5 shadow disabled:opacity-50 disabled:cursor-not-allowed"
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



      {/* Floating Limited Seats Notification */}
      {showSeatsPop && (
        <div className="fixed top-4 right-4 z-50 max-w-xs bg-gradient-to-r from-[#ff5e14] to-orange-600 text-white rounded-xl shadow-2xl p-3.5 border border-orange-400/30 flex items-center justify-between gap-3 animate-in slide-in-from-top-5 duration-300">
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-orange-200 leading-none mb-1">Attention</p>
            <h4 className="font-extrabold text-xs md:text-sm leading-snug">Limited Seats! Cohort is Live</h4>
          </div>
          <button 
            onClick={() => setShowSeatsPop(false)}
            className="hover:bg-white/20 p-1 rounded-full transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
