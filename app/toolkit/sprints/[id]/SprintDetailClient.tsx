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
  ChevronDown,
  ArrowRight,
  Loader2,
  CheckCircle,
  X,
  Gift,
  Copy,
  Play,
  HelpCircle,
  MessageSquare,
  Users,
} from "lucide-react";
import { FaLinkedinIn } from "react-icons/fa";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { extractRichTextPlainText } from "@/lib/rich-text";
import { motion, AnimatePresence } from "framer-motion";
import { StackedTestimonials } from "@/components/toolkit/StackedTestimonials";
import { ToolkitTestimonials } from "@/components/toolkit/ToolkitTestimonials";
import ToolkitStudentFeedback from "@/components/toolkit/ToolkitStudentFeedback";
import { getVideoEmbedInfo } from "@/lib/video-embed";
import { Caveat } from "next/font/google";


const caveat = Caveat({
  weight: ["400", "700"],
  variable: "--font-caveat",
  subsets: ["latin"],
});

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

interface SprintFaqItem {
  id: string;
  question: string;
  answer?: string | null;
  imageUrl?: string | null;
  orderIndex?: number;
  isActive?: boolean;
}

interface SprintData {
  id: string;
  title: string;
  slug: string;
  badge1: string;
  badge2: string;
  innerSubtitle: string;
  outerSubtitle: string;
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
  faqsHeading?: string | null;
  whoIsThisForHeading?: string | null;
  whoIsThisForBullets?: string[] | null;
  investmentLabel: string;
  basePrice: number;
  originalPrice?: number | null;
  videoUrl?: string | null;
  isBestSeller?: boolean;
  isFillingFast?: boolean;
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
  faqs?: SprintFaqItem[];
}
const loadingMessages = [
  'Becoming the "Zomato" of Marketing',
  "The marketing headstart you deserve",
  "Let's build something banger in marketing",
];

export default function SprintDetailClient() {
  const params = useParams();
  const router = useRouter();
  const sprintId = params.id as string;
  const { data: session, isPending: sessionPending } = useSession();

  const [sprint, setSprint] = useState<SprintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showSeatsPop, setShowSeatsPop] = useState(false);
  const [isBuddyOfferGlobalEnabled, setIsBuddyOfferGlobalEnabled] = useState(false);
  const [buddyOfferTitle, setBuddyOfferTitle] = useState("Friendship Day Offer");
  const [buddyOfferText, setBuddyOfferText] = useState("Learning is better together! Enter your friend's email below so they can get access that too at 20% off");
  const [activeCommunityTab, setActiveCommunityTab] = useState<"faqs" | "testimonials">("testimonials");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

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
      const response = await axios.get(`/api/sprints/${sprintId}/registration`);
      if (!response.data.completed) {
        router.replace(`/toolkit/sprints/${sprintId}/registration`);
      }
    } catch {
      // User has not paid yet — stay on sprint page
    }
  }, [sprintId, router]);

  // Buddy Program states
  const [isBuddyDialogOpen, setIsBuddyDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cover Image Carousel states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lastCohortPoster, setLastCohortPoster] = useState<string | null>(null);

  useEffect(() => {
    if (!sprint || !sprint.coverImageUrls || sprint.coverImageUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sprint.coverImageUrls!.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sprint]);

  useEffect(() => {
    if (sprint?.faqs && sprint.faqs.length > 0 && openFaqId === null) {
      setOpenFaqId(sprint.faqs[0].id);
    }
  }, [sprint, openFaqId]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Sprint link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Load Sprint details and live toolkits
  useEffect(() => {
    const fetchSprintDetails = async () => {
      try {
        const response = await axios.get(`/api/sprints/${sprintId}`);
        const data = response.data;
        setSprint(data);

        // Auto-select default tier
        const defaultTier =
          data.tiers?.find((t: Tier) => t.isDefault) || data.tiers?.[0];

        if (defaultTier) {
          setSelectedTierId(defaultTier.id);
        }

        // Poster is optional
        try {
          const posterResponse = await axios.get(
            "/api/toolkit-last-cohort-poster"
          );
          setLastCohortPoster(posterResponse.data?.imageUrl ?? null);
        } catch (posterErr) {
          console.error("Failed to load cohort poster:", posterErr);
          setLastCohortPoster(null);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load sprint details");
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

    const fetchBuddySettings = async () => {
      try {
        const response = await axios.get("/api/settings");
        setIsBuddyOfferGlobalEnabled(response.data.isBuddyOfferEnabled);
        if (response.data.buddyOfferTitle) setBuddyOfferTitle(response.data.buddyOfferTitle);
        if (response.data.buddyOfferText) setBuddyOfferText(response.data.buddyOfferText);
      } catch (err) {
        console.error("Failed to load buddy settings", err);
      }
    };

    fetchSprintDetails();
    fetchLiveToolkits();
    fetchBuddySettings();
  }, [sprintId]);

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

  useEffect(() => {
    if (!isLoading && !sessionPending) return;

    let timeout: NodeJS.Timeout;

    const cycleMessage = (index: number) => {
      timeout = setTimeout(() => {
        const nextIndex = (index + 1) % loadingMessages.length;
        setLoadingMessageIndex(nextIndex);
        cycleMessage(nextIndex);
      }, 1800);
    };

    cycleMessage(0);

    return () => clearTimeout(timeout);
  }, [isLoading, sessionPending]);


  if (isLoading || sessionPending) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff5e14] mx-auto" />
          <p className="text-sm font-semibold text-gray-500">
            {loadingMessages[loadingMessageIndex]}
          </p>
        </div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900">Program Not Found</h2>
          <p className="text-gray-600">The sprint program you&apos;re trying to view might have ended or is no longer available.</p>
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
  const activeTier = sprint.tiers?.find((t) => t.id === selectedTierId);
  const basePrice = activeTier ? activeTier.price : 0;
  // Duo: double the current price, then apply 20% off the combined total
  const finalBasePrice = isDuoActive ? getDuoPricing(basePrice).final : basePrice;

  const sessionsTotal = sprint.sessions
    ?.filter((s) => s.price && selectedAddonIds.includes(s.id))
    .reduce((acc, current) => acc + (current.price || 0), 0) || 0;
  const finalSessionsTotal = isDuoActive ? getDuoPricing(sessionsTotal).final : sessionsTotal;

  const toolkitsTotal = liveToolkits
    ?.filter((t) => selectedToolkitIds.includes(t.id))
    .reduce((acc, current) => acc + current.price, 0) || 0;

  const subtotal = finalBasePrice + finalSessionsTotal + toolkitsTotal;
  const runningTotal = Math.max(0, subtotal - couponDiscount);

  const baseOriginalPrice = activeTier ? (activeTier.originalPrice || activeTier.price) : 0;
  const sessionsOriginalTotal = sprint.sessions
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
      toast.error("Please login to register for this sprint");
      router.push(`/login?returnUrl=%2Ftoolkit%2Fsprints%2F${sprintId}`);
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
        const validateResponse = await axios.post(`/api/sprints/${sprint.id}/checkout`, {
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
      const response = await axios.post(`/api/sprints/${sprint.id}/checkout`, {
        selectedTierId: selectedTierId || null,
        selectedAddOnIds: selectedAddonIds,
        selectedToolkitIds: selectedToolkitIds,
        buyerName,
        buyerEmail,
        buyerPhone: "",
        buddyEmail: buddyEmail || null,
        couponCode: couponCode || null,
      });

      if (response.data.free || response.data.freeOrder) {
        toast.success("Registration Successful! Welcome to the sprint.");
        setIsDrawerOpen(false);
        router.push(`/toolkit/sprints/${sprintId}/registration`);
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

      const order = response.data.order || {
        id: response.data.orderId,
        amount: response.data.amount,
        currency: response.data.currency || "INR",
      };

      const razorpayKey = response.data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey || !order.id) {
        toast.error("Payment configuration error. Please contact support.");
        setIsProcessingCheckout(false);
        return;
      }

      // 3. Open Razorpay Widget
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Fire In The Belly",
        description: sprint.title,
        order_id: order.id,
        handler: async function (razorpayResponse: any) {
          setIsProcessingCheckout(true);
          try {
            // 4. Verify payment server-side
            const verifyRes = await axios.post(`/api/sprints/${sprint.id}/checkout/verify`, {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success("Registration Successful! Welcome to the sprint.");
              setIsDrawerOpen(false);
              router.push(`/toolkit/sprints/${sprintId}/registration`);
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

      rzp.on("payment.failed", async function (failureData: any) {
        console.error("Razorpay payment failed:", failureData);
        toast.error(failureData?.error?.description || "Payment failed");
        try {
          await axios.post(`/api/sprints/${sprint.id}/checkout/failed`, {
            razorpay_order_id: order.id,
            reason: failureData?.error?.description || "Payment failed",
          });
        } catch (logErr) {
          console.error("Failed to log payment failure:", logErr);
        }
      });

      rzp.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Checkout initiation failed");
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] pb-24 font-sans antialiased">
      {/* Sprint Category Label */}
      <div className="bg-white px-4 py-4 sm:py-5 overflow-hidden">
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-fit ml-4 md:ml-4 lg:ml-8 flex items-center gap-3"
        >
          <div className="h-7 w-1 bg-[#ff5e14] rounded-full shrink-0" />

          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900">
            {sprint.title}
          </h2>
        </motion.div>
      </div>

      {/* 1. Top Banner Section (Video Support with Cover Image Fallback) */}
      {(() => {
        const videoEmbed = sprint.videoUrl ? getVideoEmbedInfo(sprint.videoUrl) : null;
        return (
          <section className="relative w-full bg-white overflow-hidden">
            {/* Top Bar (Back Button + Provider Tag + Share) */}
            <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/toolkit");
                  }
                }}
                className="pointer-events-auto flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-semibold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full backdrop-blur-md transition duration-200 border border-white/20 shadow-lg group"
                aria-label="Go back"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2 pointer-events-auto">
                {videoEmbed && (
                  <span className="bg-black/70 backdrop-blur-md text-white/90 border border-white/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-md">
                    <Play className="w-3 h-3 text-[#ff5e14] fill-current" />
                    <span className="capitalize">
                      {videoEmbed.provider === "bunny"
                        ? "Bunny CDN"
                        : videoEmbed.provider === "youtube"
                          ? "YouTube"
                          : videoEmbed.provider === "instagram"
                            ? "Instagram"
                            : "Video"}
                    </span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-black/70 hover:bg-black/90 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-md transition duration-200 border border-white/20 shadow-lg"
                  aria-label="Share Sprint"
                  title="Share Sprint"
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
            </div>

            {videoEmbed ? (
              /* Top Banner Video Player (YouTube, Instagram, Bunny CDN, Direct) */
              videoEmbed.provider === "instagram" ? (
                <div className="relative w-full min-h-[420px] sm:min-h-[520px] md:min-h-[600px] bg-zinc-950 flex flex-col items-center justify-center py-4 sm:py-6 px-2 sm:px-4">
                  <div className="w-full max-w-4xl h-[420px] sm:h-[520px] md:h-[600px] flex items-center justify-center">
                    <iframe
                      src={videoEmbed.embedUrl}
                      title={`${sprint.title} Instagram Video`}
                      className="w-full h-full rounded-xl sm:rounded-2xl border border-zinc-800 shadow-2xl bg-black"
                      allow="encrypted-media; fullscreen"
                      allowFullScreen
                      scrolling="no"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="relative aspect-video md:max-h-[580px] bg-black flex items-center justify-center"
                  style={{
                    width: "calc(100% - 30px)",
                    marginLeft: "15px",
                    marginRight: "15px",
                  }}
                >
                  {videoEmbed.provider === "youtube" || videoEmbed.provider === "bunny" ? (
                    <iframe
                      src={videoEmbed.embedUrl}
                      title={`${sprint.title} Video Player`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={videoEmbed.embedUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain bg-black"
                    />
                  )}
                </div>
              )
            ) : sprint.coverImageUrls && sprint.coverImageUrls.length > 0 ? (
              /* Fallback Image Carousel */
              <div className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden flex items-end">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={sprint.coverImageUrls[currentSlide]}
                    alt={`${sprint.title} slide ${currentSlide + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>

                {sprint.coverImageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSlide((prev) =>
                          prev === 0 ? sprint.coverImageUrls!.length - 1 : prev - 1
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
                          (prev + 1) % sprint.coverImageUrls!.length
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition duration-200"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                      {sprint.coverImageUrls.map((_, idx) => (
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

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
              </div>
            ) : sprint.coverImageUrl ? (
              <div className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden flex items-end">
                <img
                  src={sprint.coverImageUrl}
                  alt={sprint.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-[#1A1A1A]" />
            )}
          </section>
        );
      })()}

      {/* Sprint Header Info Block */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-3">
          {sprint.innerSubtitle && (
            <p className="text-sm sm:text-sm md:text-base tracking-tight text-gray-600 leading-tight italic">
              {sprint.innerSubtitle}
            </p>
          )}

          {sprint.startDate && (
            <div className="pt-1 text-xs md:text-sm font-semibold text-gray-500">
              Starts on: <span className="text-gray-900 font-bold">{sprint.startDate}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-[#ff5e14] border border-orange-200 ">
              Sprint Program
            </span>
            {sprint.badge1 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {sprint.badge1}
              </span>
            )}
            {sprint.badge2 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200 ">
                {sprint.badge2}
              </span>
            )}
            {sprint.isBestSeller && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                Best Seller
              </span>
            )}
            {sprint.isFillingFast && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-200 text-red-900 border border-red-300 animate-pulse">
                Filling Fast
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Main Responsive Grid Container */}
      <main className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-8 space-y-12">

        {/* 2. Meet Your Mentors Section (Max 2 Mentors, Opposing Tilt Cards, Full Image & LinkedIn Link) */}
        {sprint.mentors && sprint.mentors.length > 0 && (
          <section className="space-y-4">
            <div className="flex justify-between items-baseline">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">
                Meet Your <span className={` text-[#ff5e14] `}>Mentors</span>
              </h2>
            </div>

            <div
              className={cn(
                "w-full py-4 px-1",
                sprint.mentors.length === 1
                  ? "flex justify-center max-w-sm mx-auto"
                  : "grid grid-cols-2 gap-3 sm:gap-8 md:gap-10 max-w-2xl mx-auto"
              )}
            >
              {sprint.mentors.slice(0, 2).map((mentor, index) => {
                const isFirst = index === 0;
                const tiltClass =
                  sprint.mentors!.length > 1
                    ? isFirst
                      ? "-rotate-2 sm:-rotate-3 hover:rotate-0 hover:scale-[1.02] active:rotate-0"
                      : "rotate-2 sm:rotate-3 hover:rotate-0 hover:scale-[1.02] active:rotate-0"
                    : "hover:scale-[1.02]";

                return (
                  <div
                    key={mentor.id}
                    className={cn(
                      "group relative self-start bg-white rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-md sm:shadow-lg overflow-hidden flex flex-col transition-all duration-300 transform-gpu",
                      tiltClass
                    )}
                  >
                    {/* Full Image Area */}
                    <div className="relative w-full aspect-[4/5] bg-neutral-900 overflow-hidden flex items-center justify-center">
                      {mentor.imageUrl ? (
                        <img
                          src={mentor.imageUrl}
                          alt={mentor.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-1.5 sm:gap-2 bg-gradient-to-b from-neutral-800 to-neutral-950">
                          <Users className="w-10 h-10 sm:w-16 sm:h-16 opacity-40 text-white" />
                          <span className="text-[10px] sm:text-xs font-semibold text-neutral-400">Mentor Photo</span>
                        </div>
                      )}

                      {/* Subtle dark gradient overlay on image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      {/* Floating Mentor Tag / Role */}
                      {mentor.role && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 max-w-[85%]">
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[11px] font-bold tracking-wide uppercase rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md truncate block">
                            {mentor.role}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Area: Name, LinkedIn & Bio */}
<div className="p-3 sm:p-5 bg-white flex flex-col flex-1">
  {/* Name + LinkedIn */}
  <div className="flex items-center justify-between gap-2">
    <h3 className="font-black text-sm sm:text-xl text-gray-900 leading-tight tracking-tight truncate">
      {mentor.name}
    </h3>

    {mentor.link && (
      <a
  href={mentor.link}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`${mentor.name}'s LinkedIn profile`}
  className="shrink-0"
>
  <FaLinkedinIn
    className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5"
    style={{ color: "#146aff" }}
  />
</a>
    )}
  </div>

  {/* Bio */}
  {mentor.bio && (
    <button
      type="button"
      onClick={() =>
        setSelectedMentor(
          selectedMentor?.id === mentor.id ? null : mentor
        )
      }
      className="text-left w-full mt-1.5 sm:mt-2"
    >
      <p
        className={cn(
          "text-[11px] sm:text-xs text-gray-600 leading-relaxed",
          selectedMentor?.id !== mentor.id && "line-clamp-3"
        )}
      >
        {mentor.bio}
      </p>

      {selectedMentor?.id !== mentor.id && (
        <span className="text-[9px] sm:text-xs font-semibold text-[#ff5e14]">
          ... Read more
        </span>
      )}
    </button>
  )}
</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* What's The Buzz Section */}
          {sprint.features && sprint.features.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">
                What&apos;s The {" "}
                <span className={` text-[#ff5e14] `}>
                  Buzz?
                </span>
              </h2>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {sprint.features?.slice(0, 3).map((feature) => {
              const descriptionPoints = Array.isArray(feature.description)
                ? feature.description
                : [feature.description];

              return (
                <div
                  key={feature.id || feature.title}
                  className="relative overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm"
                >
                  <div className="p-5 md:p-6">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 leading-snug pl-1">
                      {feature.title}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs md:text-base text-gray-600 leading-relaxed pl-1">
                      {descriptionPoints.map((point, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-[#ff5e14]" />
                          <span className="text-sm" >{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                );
              })}
              </div>
            </section>
          )}

        {/* Who Is This For Section */}
        {sprint.whoIsThisForBullets && sprint.whoIsThisForBullets.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 border-black pb-1 inline-block">
              Who Is This For?{" "}
              <span className={`${caveat.className} text-[#ff5e14] text-2xl md:text-3xl`}>
                (You, obviously.)
              </span>
            </h2>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sprint.whoIsThisForBullets.map((bullet, index) => (
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
        {isBuddyOfferGlobalEnabled && (
          <section className="bg-gradient-to-r from-orange-500 to-[#ff5e14] rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5" /> Buddy Program
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                Enjoy Sprint with a friend &lt;3!
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
        )}

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
                  Enjoy Sprint with a friend &lt;3!
                </h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  We absolutely love ungatekeepers. So, here is something for you. Enroll with a friend - get straight up 20% off &amp; a partner to level up with (ek teer se do nishaane, lessgoo!)
                </p>
              </div>

              {/* Share link */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Sprint Share Link
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
                  href={`https://wa.me/?text=${encodeURIComponent(`Hey! I was checking out this amazing sprint program: "${sprint?.title}". Let's apply and do it together! Check it out here: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
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

        {/* FAQs & Testimonials Interactive Section */}
        <section className="space-y-4 pt-6">
          {/* Quick Navigation Toggle */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center gap-4 border-b border-gray-200/80 pb-4">


            <div className="inline-flex p-1.5 bg-gray-500 rounded-2xl border border-gray-200/90 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveCommunityTab("faqs")}
                className={cn(
                  "px-5 py-2.5 text-sm md:text-base font-bold rounded-xl transition-all duration-200 flex items-center gap-2",
                  activeCommunityTab === "faqs"
                    ? "bg-black text-[#ff5e14] shadow-sm"
                    : "text-black hover:bg-white/70"
                )}
              >
                <HelpCircle className="w-4 h-4 text-[#ff5e14]" />
                <span>FAQs</span>
                {sprint.faqs && sprint.faqs.length > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                      activeCommunityTab === "faqs"
                        ? "bg-orange-100 text-[#ff5e14]"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {sprint.faqs.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveCommunityTab("testimonials")}
                className={cn(
                  "px-5 py-2.5 text-sm md:text-base font-bold rounded-xl transition-all duration-200 flex items-center gap-2",
                  activeCommunityTab === "testimonials"
                    ? "bg-black text-[#ff5e14] shadow-sm"
                    : "text-black hover:bg-white/70"
                )}
              >
                <MessageSquare className="w-4 h-4 text-[#ff5e14]" />
                <span>Testimonials</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeCommunityTab === "faqs" ? (
              <motion.div
                key="faqs-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {!sprint.faqs || sprint.faqs.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <p className="font-medium">No frequently asked questions listed yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Have questions? Feel free to enquire directly using the button below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sprint.faqs.map((faq, index) => {
                      const isOpen = openFaqId === faq.id;
                      return (
                        <div
                          key={faq.id || index}
                          className={cn(
                            "rounded-2xl border transition-all duration-200 overflow-hidden",
                            isOpen
                              ? "bg-white border-orange-200 shadow-md ring-1 ring-orange-200/50"
                              : "bg-white border-gray-200/90 shadow-sm hover:border-gray-300"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                            className="w-full py-4 px-5 flex items-center justify-between text-left gap-4"
                            aria-expanded={isOpen}
                          >
                            <span className="text-sm md:text-base font-bold text-gray-900 leading-snug">
                              {faq.question}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200",
                                isOpen
                                  ? "bg-orange-100 text-[#ff5e14]"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              )}
                            >
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 transition-transform duration-200",
                                  isOpen ? "rotate-180" : "rotate-0"
                                )}
                              />
                            </span>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-3.5">
                                  {faq.answer && (
                                    <p className="text-xs md:text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                                      {faq.answer}
                                    </p>
                                  )}


                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {/* FAQ Schema for SEO */}
                    <script
                      type="application/ld+json"
                      dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                          "@context": "https://schema.org",
                          "@type": "FAQPage",
                          mainEntity: sprint.faqs.map((f) => ({
                            "@type": "Question",
                            name: f.question,
                            acceptedAnswer: {
                              "@type": "Answer",
                              text: f.answer || f.question,
                            },
                          })),
                        }).replace(/</g, "\\u003c"),
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="testimonials-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <StackedTestimonials />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {lastCohortPoster && (
              <section className=" relative left-1/2 -translate-x-1/2 md:w-full md:left-0 md:translate-x-0">
                <div className="relative w-full md:w-[85%] lg:w-[75%] xl:w-[70%] mx-auto aspect-video overflow-hidden bg-black">
                  <img
                    src={lastCohortPoster}
                    alt="Last cohort"
                    className="w-full h-full object-cover"
                  />
                </div>
              </section>
            )}

            <ToolkitTestimonials images={[]} />

            <div className="max-w-2xl mx-auto">
              <ToolkitStudentFeedback />
            </div>
          </div>

        </section>
      </main>

      {/* 4. Sticky Bottom Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 py-3.5 px-4 shadow-xl z-30">
        <div className="max-w-md md:max-w-lg mx-auto flex gap-3 items-center justify-between">
          <a
            href={`https://wa.me/916377492042?text=Hi!%20I'd%20like%20to%20enquire%20about%20the%20sprint%20program:%20${encodeURIComponent(sprint.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm md:text-base py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0 md:w-5 md:h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.808 1.236h.005c5.505 0 9.99-4.477 9.99-9.985C22.005 6.478 17.518 2 12.012 2Zm5.845 14.285c-.244.686-1.42 1.328-1.948 1.41-.478.077-1.101.144-3.187-.723-2.667-1.108-4.37-3.816-4.502-3.992-.133-.176-1.077-1.43-1.077-2.729 0-1.298.679-1.937.922-2.202.244-.265.533-.332.71-.332.178 0 .356.006.51.013.162.008.38-.06.593.453.22.532.753 1.836.82 1.968.067.133.11.288.022.465-.088.177-.133.288-.266.443-.133.155-.28.347-.4.493-.133.16-.272.336-.117.6.155.265.686 1.132 1.47 1.831.99.885 1.823 1.157 2.08 1.288.254.133.403.11.553-.066.15-.177.643-.753.815-.996.172-.244.344-.2.58-.112.235.088 1.492.703 1.748.83.256.128.427.194.49.305.061.11.061.643-.183 1.329Z" />
            </svg>
            Enquire Now
          </a>

          {sprint.hasAccess ? (
            <button
              onClick={() => {
                if (sprint.toolkitId) {
                  router.push(`/toolkit/${sprint.toolkitId}/content`);
                } else {
                  // Redirect to sprint dashboard if no toolkit id
                  router.push(`/toolkit/sprints/${sprintId}/dashboard`);
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-750 text-white font-bold text-sm md:text-base py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
            >
              View Sprint <ChevronRight className="w-4 h-4" />
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

      {/* Upsell Bottom Sheet */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[20px] h-[85vh] fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto overflow-hidden">
            {/* Drawer Marquee Banner */}
            {sprint.showEarlyBirdMarqueeCheckout && (
              <div className="w-full bg-black text-[#ff5e14] py-2 overflow-hidden relative font-extrabold text-[9px] uppercase tracking-widest select-none shrink-0 border-b border-gray-100">
                <div className="marquee-container flex">
                  <div className="animate-marquee flex whitespace-nowrap gap-8">
                    {Array(8).fill("Early Bird Offer! Get 20% off with Buddy Referral").map((text, i) => (
                      <span key={i} className="flex items-center gap-4 shrink-0">
                        <span>{text}</span>
                        <span className="text-neutral-800 font-black">•</span>
                      </span>
                    ))}
                  </div>
                  <div className="animate-marquee flex whitespace-nowrap gap-8" aria-hidden="true">
                    {Array(8).fill("Early Bird Offer! Get 20% off with Buddy Referral").map((text, i) => (
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
                <Drawer.Title className="text-base font-bold">Select Your Sprint Plan</Drawer.Title>
                <Drawer.Description className="text-xs text-gray-500">Pick packages &amp; optional career add-ons</Drawer.Description>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Tiers/Bundles Selection */}
              {sprint.tiers && sprint.tiers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Choose a Bundle Tier</h4>
                  <div className="space-y-2">
                    {sprint.tiers.map((tier) => {
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
                                    <Check className="w-3 h-3 text-[#ff5e14] shrink-0" />{inc}
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

              {/* Buddy Offer Card */}
              {isBuddyOfferGlobalEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#ff5e14]" /> {buddyOfferTitle}
                    </h4>
                    <span className="text-[#ff5e14] text-[9px] font-bold uppercase tracking-wider">
                      Optional Referral
                    </span>
                  </div>
                  <div className="relative group overflow-hidden p-[1.5px] rounded-xl bg-gradient-to-r from-orange-300 via-[#ff5e14] to-yellow-400 animate-gradient hover:shadow-[0_0_15px_rgba(255,94,20,0.25)] transition-all duration-300">
                    <div className="relative bg-white/95 backdrop-blur-sm p-3 rounded-[10px] space-y-2 z-10 h-full">
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        {buddyOfferText}
                      </p>
                      <div className="relative">
                        <input
                          type="email"
                          value={buddyEmail}
                          onChange={(e) => setBuddyEmail(e.target.value)}
                          placeholder="buddy@example.com"
                          className="w-full pl-8 pr-3 py-2 border-2 border-orange-100 focus:border-[#ff5e14] focus:ring-4 focus:ring-orange-500/20 rounded-lg text-xs transition-all bg-white outline-none"
                        />
                        <Gift className="w-3.5 h-3.5 text-orange-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#ff5e14] transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add-ons Selection (Individual Sessions) */}
              {sprint.sessions && sprint.sessions.filter(s => s.price && s.price > 0).length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Individual Sessions</h4>
                    <p className="text-[10px] text-gray-500">Choosing an individual session will deselect the bundle tier.</p>
                  </div>
                  <div className="space-y-2">
                    {sprint.sessions.filter(s => s.price && s.price > 0).map((session, index) => {
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
                              onChange={() => { }} // toggled by parent div
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
              {sprint.showAddonsCheckout !== false && liveToolkits && liveToolkits.filter(t => t.id !== sprint.toolkitId).length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Optional Add-Ons</h4>
                    <p className="text-[10px] text-gray-500">Get additional 1:1 services to level up your sprint experience</p>
                  </div>
                  <div className="space-y-2">
                    {liveToolkits.filter(t => t.id !== sprint.toolkitId).map((tk) => {
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
                              onChange={() => { }} // toggled by parent div
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
                        const response = await axios.post(`/api/sprints/${sprint.id}/checkout`, {
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
                  <div className="hidden">
                    {/* buddy email moved to top */}
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
                      <span className="line-through text-xs text-gray-400 font-medium">₹{totalOriginalPrice}</span>
                      <span className="bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Coupon Applied
                      </span>
                    </>
                  )}
                  {sprint.showEarlyBirdCheckout && totalOriginalPrice > runningTotal && couponDiscount === 0 && (
                    <>
                      <span className="line-through text-xs text-gray-400 font-medium">₹{totalOriginalPrice}</span>
                      <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Early Bird offer
                      </span>
                    </>
                  )}
                  {!sprint.showEarlyBirdCheckout && isDuoActive && (selectedTierId || selectedAddonIds.length > 0) && couponDiscount === 0 && (
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
                    Confirm &amp; Checkout <ArrowRight className="w-3.5 h-3.5" />
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
            <h4 className="font-extrabold text-xs md:text-sm leading-snug">Limited Seats! Sprint is Live</h4>
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
