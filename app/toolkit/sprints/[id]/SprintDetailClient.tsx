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
  HelpCircle,
  MessageSquare,
  Users,
  Share2,
} from "lucide-react";
import { FaLinkedinIn } from "react-icons/fa";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
// import { extractRichTextPlainText } from "@/lib/rich-text";
import { motion, AnimatePresence } from "framer-motion";
import { StackedTestimonials } from "@/components/toolkit/StackedTestimonials";
import { ToolkitTestimonials } from "@/components/toolkit/ToolkitTestimonials";
import ToolkitStudentFeedback from "@/components/toolkit/ToolkitStudentFeedback";
import { getVideoEmbedInfo } from "@/lib/video-embed";
import { caveat } from "@/lib/fonts";
import SprintBunnyPlayer from "@/components/toolkit/SprintBunnyPlayer";

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
  isFillingFast?: boolean;
  isTrending?: boolean;
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
  const [isBuddyOfferGlobalEnabled, setIsBuddyOfferGlobalEnabled] =
    useState(false);
  const [buddyOfferTitle, setBuddyOfferTitle] = useState(
    "Friendship Day Offer"
  );
  const [buddyOfferText, setBuddyOfferText] = useState(
    "Learning is better together! Enter your friend's email below so they can get access that too at 20% off"
  );
  const [activeCommunityTab, setActiveCommunityTab] = useState<
    "faqs" | "testimonials"
  >("testimonials");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Upsell Modal / Bottom Sheet selections
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedToolkitIds, _setSelectedToolkitIds] = useState<string[]>([]);
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
    if (!sprint || !sprint.coverImageUrls || sprint.coverImageUrls.length <= 1)
      return;
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
  const handleLastCohortClick = () => {
    document.getElementById("last-cohort-poster")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
        if (response.data.buddyOfferTitle)
          setBuddyOfferTitle(response.data.buddyOfferTitle);
        if (response.data.buddyOfferText)
          setBuddyOfferText(response.data.buddyOfferText);
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
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="space-y-2 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#ff5e14]" />
          <p className="text-sm font-semibold text-gray-500">
            {loadingMessages[loadingMessageIndex]}
          </p>
        </div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-4">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Program Not Found
          </h2>
          <p className="text-gray-600">
            The sprint program you&apos;re trying to view might have ended or is
            no longer available.
          </p>
          <button
            onClick={() => router.push("/toolkit")}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
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
  const finalBasePrice = isDuoActive
    ? getDuoPricing(basePrice).final
    : basePrice;

  const sessionsTotal =
    sprint.sessions
      ?.filter((s) => s.price && selectedAddonIds.includes(s.id))
      .reduce((acc, current) => acc + (current.price || 0), 0) || 0;
  const finalSessionsTotal = isDuoActive
    ? getDuoPricing(sessionsTotal).final
    : sessionsTotal;

  const toolkitsTotal =
    liveToolkits
      ?.filter((t) => selectedToolkitIds.includes(t.id))
      .reduce((acc, current) => acc + current.price, 0) || 0;

  const subtotal = finalBasePrice + finalSessionsTotal + toolkitsTotal;
  const runningTotal = Math.max(0, subtotal - couponDiscount);

  const baseOriginalPrice = activeTier
    ? activeTier.originalPrice || sprint.originalPrice || activeTier.price
    : sprint.originalPrice || sprint.basePrice || 0;
  const sessionsOriginalTotal =
    sprint.sessions
      ?.filter((s) => s.price && selectedAddonIds.includes(s.id))
      .reduce(
        (acc, current) => acc + (current.originalPrice || current.price || 0),
        0
      ) || 0;
  const totalOriginalPrice =
    baseOriginalPrice + sessionsOriginalTotal + toolkitsTotal;

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
        const validateResponse = await axios.post(
          `/api/sprints/${sprint.id}/checkout`,
          {
            selectedTierId: selectedTierId || null,
            selectedAddOnIds: selectedAddonIds,
            selectedToolkitIds: selectedToolkitIds,
            buyerName,
            buyerEmail,
            buyerPhone: "",
            buddyEmail: buddyEmail || null,
            couponCode: couponCode.trim(),
            validateCouponOnly: true,
          }
        );
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

      const razorpayKey =
        response.data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

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
            const verifyRes = await axios.post(
              `/api/sprints/${sprint.id}/checkout/verify`,
              {
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }
            );

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
    <div className="min-h-screen bg-[#FAF9F6] pb-24 font-sans text-[#1A1A1A] antialiased">
      {/* Sprint Category Label */}
      <div className="relative overflow-hidden bg-white px-4 py-3 sm:py-4">
        <div className="ml-4 flex w-full items-center pr-2 md:ml-4 lg:ml-8">
          {/* Animated Sprint Title */}
          <motion.div
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="h-7 w-1 shrink-0 rounded-full bg-[#ff5e14]" />

            <h2 className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-2xl">
              {sprint.title}
            </h2>
          </motion.div>

          {/* Static Actions */}
          <div className="mr-4 ml-auto flex shrink-0 -translate-y-1 items-center gap-1.5">
            {/* Share */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="shrink-0 rounded-full p-1 text-gray-800 transition duration-200 hover:bg-gray-200"
              aria-label="Share Sprint"
              title="Share Sprint"
            >
              {copied ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Last Cohort */}
            {lastCohortPoster && (
              <button
                type="button"
                onClick={handleLastCohortClick}
                className="shrink-0 rounded-full bg-emerald-500 px-2 py-1.5 text-[9px] font-semibold whitespace-nowrap text-white shadow-sm transition duration-200 hover:bg-emerald-600"
                aria-label="View last cohort"
              >
                Last Cohort
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Top Banner Section (Video Support with Cover Image Fallback) */}
      {(() => {
        const videoEmbed = sprint.videoUrl
          ? getVideoEmbedInfo(sprint.videoUrl)
          : null;
        return (
          <section className="relative w-full overflow-hidden bg-white">
            {/* Top Bar (Back Button + Provider Tag + Share) */}
            <div className="pointer-events-none absolute top-3 right-3 left-3 z-30 flex items-center justify-between sm:top-4 sm:right-4 sm:left-4">
              <button
                type="button"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.history.length > 1
                  ) {
                    router.back();
                  } else {
                    router.push("/toolkit");
                  }
                }}
                className="group pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition duration-200 hover:bg-black/90 sm:px-3.5 sm:py-2"
                aria-label="Go back"
              >
                <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5 sm:h-4 sm:w-4" />
                <span>Back</span>
              </button>

              <div className="pointer-events-auto flex items-center gap-2" />
            </div>

            {videoEmbed ? (
              /* Top Banner Video Player (YouTube, Instagram, Bunny CDN, Direct) */
              videoEmbed.provider === "instagram" ? (
                <div className="relative flex min-h-[420px] w-full flex-col items-center justify-center bg-zinc-950 px-2 py-4 sm:min-h-[520px] sm:px-4 sm:py-6 md:min-h-[600px]">
                  <div className="flex h-[420px] w-full max-w-4xl items-center justify-center sm:h-[520px] md:h-[600px]">
                    <iframe
                      src={videoEmbed.embedUrl}
                      title={`${sprint.title} Instagram Video`}
                      className="h-full w-full rounded-xl border border-zinc-800 bg-black shadow-2xl sm:rounded-2xl"
                      allow="encrypted-media; fullscreen"
                      allowFullScreen
                      scrolling="no"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "relative mx-[15px] w-[calc(100%-30px)] overflow-hidden rounded-xl bg-black",
                    videoEmbed.provider !== "bunny" && "aspect-video"
                  )}
                  style={{
                    width: "calc(100% - 30px)",
                    marginLeft: "15px",
                    marginRight: "15px",
                  }}
                >
                  {videoEmbed.provider === "youtube" ? (
                    <iframe
                      src={videoEmbed.embedUrl}
                      title={`${sprint.title} Video Player`}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  ) : videoEmbed.provider === "bunny" ? (
                    <SprintBunnyPlayer
                      videoUrl={sprint.videoUrl}
                      sprintId={sprint.id}
                      title={`${sprint.title} Video Player`}
                      className="w-full"
                    />
                  ) : (
                    <video
                      src={videoEmbed.embedUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full bg-black object-contain"
                    />
                  )}
                </div>
              )
            ) : sprint.coverImageUrls && sprint.coverImageUrls.length > 0 ? (
              /* Fallback Image Carousel */
              <div className="relative flex aspect-[4/3] w-full items-end overflow-hidden md:aspect-[21/9]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={sprint.coverImageUrls[currentSlide]}
                    alt={`${sprint.title} slide ${currentSlide + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>

                {sprint.coverImageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSlide((prev) =>
                          prev === 0
                            ? sprint.coverImageUrls!.length - 1
                            : prev - 1
                        )
                      }
                      className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition duration-200 hover:bg-black/60"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSlide(
                          (prev) => (prev + 1) % sprint.coverImageUrls!.length
                        )
                      }
                      className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition duration-200 hover:bg-black/60"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                      {sprint.coverImageUrls.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentSlide(idx)}
                          className={cn(
                            "h-2 w-2 rounded-full transition-all duration-300",
                            idx === currentSlide
                              ? "w-4 bg-white"
                              : "bg-white/50"
                          )}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            ) : sprint.coverImageUrl ? (
              <div className="relative flex aspect-[4/3] w-full items-end overflow-hidden md:aspect-[21/9]">
                <img
                  src={sprint.coverImageUrl}
                  alt={sprint.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            ) : (
              <div className="relative aspect-[16/9] w-full bg-[#1A1A1A] md:aspect-[21/9]" />
            )}
          </section>
        );
      })()}

      {/* Sprint Header Info Block */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-md space-y-3 px-4 py-6 sm:py-8 md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
          {sprint.innerSubtitle && (
            <p className="text-sm leading-tight tracking-tight text-gray-600 italic sm:text-sm md:text-base">
              {sprint.innerSubtitle}
            </p>
          )}

          {sprint.startDate && (
            <div className="pt-1 text-xs font-semibold text-gray-500 md:text-sm">
              Starts on:{" "}
              <span className="font-bold text-gray-900">
                {sprint.startDate}
              </span>
            </div>
          )}

          {(sprint.badge1 || sprint.badge2) && (
            <div className="flex flex-wrap items-center gap-2">
              {sprint.badge1 && (
                <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  {sprint.badge1}
                </span>
              )}
              {sprint.badge2 && (
                <span className="rounded-full border border-purple-200 bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                  {sprint.badge2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Responsive Grid Container */}
      <main className="mx-auto max-w-md space-y-12 px-4 py-8 md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        {/* 2. Meet Your Mentors Section (Max 2 Mentors, Opposing Tilt Cards, Full Image & LinkedIn Link) */}
        {sprint.mentors && sprint.mentors.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-black tracking-tight text-gray-900 md:text-2xl">
                Meet Your <span className={`text-[#ff5e14]`}>Mentors</span>
              </h2>
            </div>

            <div
              className={cn(
                "w-full px-1 py-4",
                sprint.mentors.length === 1
                  ? "mx-auto flex max-w-sm justify-center"
                  : "mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-8 md:gap-10"
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
                      "group relative flex transform-gpu flex-col self-start overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md transition-all duration-300 sm:rounded-3xl sm:shadow-lg",
                      tiltClass
                    )}
                  >
                    {/* Full Image Area */}
                    <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-neutral-900">
                      {mentor.imageUrl ? (
                        <img
                          src={mentor.imageUrl}
                          alt={mentor.name}
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-neutral-800 to-neutral-950 text-neutral-500 sm:gap-2">
                          <Users className="h-10 w-10 text-white opacity-40 sm:h-16 sm:w-16" />
                          <span className="text-[10px] font-semibold text-neutral-400 sm:text-xs">
                            Mentor Photo
                          </span>
                        </div>
                      )}

                      {/* Subtle dark gradient overlay on image */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Floating Mentor Tag / Role */}
                      {mentor.role && (
                        <div className="absolute top-2 left-2 z-10 max-w-[85%] sm:top-3 sm:left-3">
                          <span className="block truncate rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-md sm:px-3 sm:py-1 sm:text-[11px]">
                            {mentor.role}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Area: Name, LinkedIn & Bio */}
                    <div className="flex flex-1 flex-col bg-white p-3 sm:p-5">
                      {/* Name + LinkedIn */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm leading-tight font-black tracking-tight text-gray-900 sm:text-xl">
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
                              className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5"
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
                          className="mt-1.5 w-full text-left sm:mt-2"
                        >
                          <p
                            className={cn(
                              "text-[11px] leading-relaxed text-gray-600 sm:text-xs",
                              selectedMentor?.id !== mentor.id && "line-clamp-3"
                            )}
                          >
                            {mentor.bio}
                          </p>

                          {selectedMentor?.id !== mentor.id && (
                            <span className="text-[9px] font-semibold text-[#ff5e14] sm:text-xs">
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
            <h2 className="text-xl font-black tracking-tight text-gray-900 md:text-2xl">
              What&apos;s The <span className={`text-[#ff5e14]`}>Buzz?</span>
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
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
                      <h3 className="pl-1 text-sm leading-snug font-bold text-gray-900 md:text-base">
                        {feature.title}
                      </h3>

                      <div className="mt-2 space-y-1 pl-1 text-xs leading-relaxed text-gray-600 md:text-base">
                        {descriptionPoints.map((point, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-[#ff5e14]" />
                            <span className="text-sm">{point}</span>
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
        {sprint.whoIsThisForBullets &&
          sprint.whoIsThisForBullets.length > 0 && (
            <section className="space-y-4">
              <h2 className="inline-block border-black pb-1 text-xl font-black tracking-tight text-gray-900 md:text-2xl">
                Who Is This For?{" "}
                <span
                  className={`${caveat.className} text-2xl text-[#ff5e14] md:text-3xl`}
                >
                  (You, obviously.)
                </span>
              </h2>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {sprint.whoIsThisForBullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-[#ff5e14]">
                        {index + 1}
                      </span>
                      <span className="text-gray-650 text-justify text-sm leading-relaxed">
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
          <section className="mt-8 flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-orange-500 to-[#ff5e14] p-6 text-white shadow-lg md:flex-row md:p-8">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold tracking-wider uppercase md:text-xs">
                <Gift className="h-3.5 w-3.5" /> Buddy Program
              </div>
              <h2 className="text-xl leading-tight font-black tracking-tight md:text-2xl">
                Enjoy Sprint with a friend &lt;3!
              </h2>
              <p className="max-w-md text-xs leading-relaxed text-orange-50/95 md:text-sm">
                We absolutely love ungatekeepers. So, here is something for you.
                Enroll with a friend - get straight up 20% off &amp; a partner
                to level up with (ek teer se do nishaane, lessgoo!)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBuddyDialogOpen(true)}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold whitespace-nowrap text-[#ff5e14] shadow-md transition hover:bg-neutral-100 md:w-auto md:text-sm"
            >
              <Gift className="h-4 w-4" />
              Invite Buddy Now
            </button>
          </section>
        )}

        {/* Buddy Program Modal - rendered outside section to avoid z-index/blur conflicts */}
        {isBuddyDialogOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsBuddyDialogOpen(false);
            }}
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl">
              {/* Decorative blob */}
              <div className="pointer-events-none absolute top-0 right-0 -z-10 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-orange-50 blur-3xl" />

              {/* Close X button */}
              <button
                type="button"
                onClick={() => setIsBuddyDialogOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="mb-6 flex flex-col items-center space-y-3 text-center">
                <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-black tracking-widest text-[#ff5e14] uppercase">
                  Buddy Benefit
                </span>
                <div className="w-fit rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 p-3.5 text-[#ff5e14] shadow-inner">
                  <Gift className="h-6 w-6 animate-bounce" />
                </div>
                <h3 className="text-xl leading-tight font-extrabold text-gray-900">
                  Enjoy Sprint with a friend &lt;3!
                </h3>
                <p className="max-w-sm text-xs leading-relaxed text-gray-500">
                  We absolutely love ungatekeepers. So, here is something for
                  you. Enroll with a friend - get straight up 20% off &amp; a
                  partner to level up with (ek teer se do nishaane, lessgoo!)
                </p>
              </div>

              {/* Share link */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Sprint Share Link
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
                    <span className="flex-1 truncate pl-2 text-xs font-medium text-gray-600 select-all">
                      {typeof window !== "undefined"
                        ? window.location.href
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white shadow transition duration-200 hover:bg-neutral-800"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />{" "}
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-gray-300" /> Copy
                          Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* WhatsApp Share */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hey! I was checking out this amazing sprint program: "${sprint?.title}". Let's apply and do it together! Check it out here: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-bold text-white shadow-md transition duration-200 hover:bg-emerald-700 hover:shadow-lg"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.808 1.236h.005c5.505 0 9.99-4.477 9.99-9.985C22.005 6.478 17.518 2 12.012 2Zm5.845 14.285c-.244.686-1.42 1.328-1.948 1.41-.478.077-1.101.144-3.187-.723-2.667-1.108-4.37-3.816-4.502-3.992-.133-.176-1.077-1.43-1.077-2.729 0-1.298.679-1.937.922-2.202.244-.265.533-.332.71-.332.178 0 .356.006.51.013.162.008.38-.06.593.453.22.532.753 1.836.82 1.968.067.133.11.288.022.465-.088.177-.133.288-.266.443-.133.155-.28.347-.4.493-.133.16-.272.336-.117.6.155.265.686 1.132 1.47 1.831.99.885 1.823 1.157 2.08 1.288.254.133.403.11.553-.066.15-.177.643-.753.815-.996.172-.244.344-.2.58-.112.235.088 1.492.703 1.748.83.256.128.427.194.49.305.061.11.061.643-.183 1.329Z" />
                  </svg>
                  Share via WhatsApp
                </a>
              </div>

              {/* Footer Actions */}
              <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBuddyDialogOpen(false)}
                  className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-700 transition duration-200 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBuddyDialogOpen(false);
                    setIsDrawerOpen(true);
                  }}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#ff5e14] to-[#ff7a3d] py-3 text-xs font-bold text-white shadow-md transition duration-200 hover:from-[#e04f0f] hover:to-[#ff5e14] hover:shadow-lg"
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
          <div className="flex flex-col items-center justify-center gap-4 border-b border-gray-200/80 pb-4 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-2xl border border-gray-200/90 bg-gray-500 p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveCommunityTab("faqs")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 md:text-base",
                  activeCommunityTab === "faqs"
                    ? "bg-black text-[#ff5e14] shadow-sm"
                    : "text-black hover:bg-white/70"
                )}
              >
                <HelpCircle className="h-4 w-4 text-[#ff5e14]" />
                <span>FAQs</span>
                {sprint.faqs && sprint.faqs.length > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
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
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 md:text-base",
                  activeCommunityTab === "testimonials"
                    ? "bg-black text-[#ff5e14] shadow-sm"
                    : "text-black hover:bg-white/70"
                )}
              >
                <MessageSquare className="h-4 w-4 text-[#ff5e14]" />
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
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center text-sm text-gray-500">
                    <p className="font-medium">
                      No frequently asked questions listed yet.
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Have questions? Feel free to enquire directly using the
                      button below.
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
                            "overflow-hidden rounded-2xl border transition-all duration-200",
                            isOpen
                              ? "border-orange-200 bg-white shadow-md ring-1 ring-orange-200/50"
                              : "border-gray-200/90 bg-white shadow-sm hover:border-gray-300"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            aria-expanded={isOpen}
                          >
                            <span className="text-sm leading-snug font-bold text-gray-900 md:text-base">
                              {faq.question}
                            </span>
                            <span
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
                                isOpen
                                  ? "bg-orange-100 text-[#ff5e14]"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              )}
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
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
                                transition={{
                                  duration: 0.25,
                                  ease: "easeInOut",
                                }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-3.5 border-t border-gray-100 px-5 pt-1 pb-5">
                                  {faq.answer && (
                                    <p className="text-xs leading-relaxed whitespace-pre-line text-gray-600 md:text-sm">
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
              <section
                id="last-cohort-poster"
                className="relative left-1/2 -translate-x-1/2 md:left-0 md:w-full md:translate-x-0"
              >
                <div className="relative mx-auto aspect-video w-full overflow-hidden bg-black md:w-[85%] lg:w-[75%] xl:w-[70%]">
                  <a
                    href="https://www.ftbhustle.com/toolkit/cohorts/3608f9b4-4f7a-46dc-abb3-93dd29873cc3"
                    className="block cursor-pointer"
                  >
                    <img
                      src={lastCohortPoster}
                      alt="Last cohort"
                      className="h-full w-full object-cover"
                    />
                  </a>
                </div>
              </section>
            )}

            <ToolkitTestimonials images={[]} />

            <div className="mx-auto max-w-2xl">
              <ToolkitStudentFeedback />
            </div>
          </div>
        </section>
      </main>

      {/* 4. Sticky Bottom Bar */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 py-3.5 shadow-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 md:max-w-lg">
          <a
            href={`https://wa.me/916377492042?text=Hi!%20I'd%20like%20to%20enquire%20about%20the%20sprint%20program:%20${encodeURIComponent(sprint.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 md:text-base"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 shrink-0 md:h-5 md:w-5"
              xmlns="http://www.w3.org/2000/svg"
            >
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
              className="hover:bg-green-750 flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition md:text-base"
            >
              View Sprint <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#ff5e14] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/10 transition hover:bg-[#e04f0f] md:text-base"
            >
              Apply Now <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </footer>

      {/* Upsell Bottom Sheet */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content className="fixed right-0 bottom-0 left-0 z-50 mx-auto flex h-[85vh] max-w-lg flex-col overflow-hidden rounded-t-[20px] bg-white">
            {/* Drawer Marquee Banner */}
            {/* {sprint.showEarlyBirdMarqueeCheckout && (
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
            )} */}

            <div className="flex shrink-0 items-center justify-between border-b bg-gray-50 p-4">
              <div>
                <Drawer.Title className="text-base font-bold">
                  Select Your Sprint Plan
                </Drawer.Title>
                <Drawer.Description className="text-xs text-gray-500">
                  Pick packages
                </Drawer.Description>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full p-1 hover:bg-gray-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Tiers/Bundles Selection */}
              {sprint.tiers && sprint.tiers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Choose a Bundle Tier
                  </h4>
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
                            "flex cursor-pointer items-start justify-between rounded-xl border-2 p-4 transition",
                            isSelected
                              ? "border-[#ff5e14] bg-orange-50/20"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-sm font-bold text-gray-900">
                                {tier.name}
                              </h5>

                              {tier.isFillingFast && (
                                <span className="animate-pulse rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold tracking-wider text-[#ff5e14] uppercase">
                                  Filling Fast
                                </span>
                              )}

                              {tier.isTrending && (
                                <span className="animate-pulse rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold tracking-wider text-blue-600 uppercase">
                                  Trending
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {tier.description}
                            </p>
                            {tier.whatIncluded &&
                              tier.whatIncluded.length > 0 && (
                                <ul className="space-y-0.5 pt-1.5 text-[10px] text-gray-400">
                                  {tier.whatIncluded.map((inc, i) => (
                                    <li
                                      key={i}
                                      className="flex items-center gap-1"
                                    >
                                      <Check className="h-3 w-3 shrink-0 text-[#ff5e14]" />
                                      {inc}
                                    </li>
                                  ))}
                                </ul>
                              )}
                          </div>
                          <div className="flex flex-col items-end">
                            {isDuoActive ? (
                              <>
                                <span className="text-sm font-bold text-[#ff5e14]">
                                  ₹{Math.round(tier.price * 0.8)}
                                </span>
                                <span className="text-[10px] text-gray-400 line-through">
                                  ₹{tier.price}
                                </span>
                                <span className="text-[9px] font-medium whitespace-nowrap text-emerald-600">
                                  ≈ ₹{Math.round((tier.price * 0.8) / 2)}/head
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-bold text-[#ff5e14]">
                                  ₹{tier.price}
                                </span>
                                {(tier as any).originalPrice &&
                                  (tier as any).originalPrice > tier.price && (
                                    <span className="mt-0.5 text-xs text-gray-400 line-through">
                                      ₹{(tier as any).originalPrice}
                                    </span>
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
                    <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                      <Gift className="h-3.5 w-3.5 text-[#ff5e14]" />{" "}
                      {buddyOfferTitle}
                    </h4>
                    <span className="text-[9px] font-bold tracking-wider text-[#ff5e14] uppercase">
                      Optional Referral
                    </span>
                  </div>
                  <div className="group animate-gradient relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-300 via-[#ff5e14] to-yellow-400 p-[1.5px] transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,94,20,0.25)]">
                    <div className="relative z-10 h-full space-y-2 rounded-[10px] bg-white/95 p-3 backdrop-blur-sm">
                      <p className="text-[11px] leading-relaxed font-medium text-gray-600">
                        {buddyOfferText}
                      </p>
                      <div className="relative">
                        <input
                          type="email"
                          value={buddyEmail}
                          onChange={(e) => setBuddyEmail(e.target.value)}
                          placeholder="buddy@example.com"
                          className="w-full rounded-lg border-2 border-orange-100 bg-white py-2 pr-3 pl-8 text-xs transition-all outline-none focus:border-[#ff5e14] focus:ring-4 focus:ring-orange-500/20"
                        />
                        <Gift className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-orange-300 transition-colors group-focus-within:text-[#ff5e14]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add-ons Selection (Individual Sessions) */}
              {sprint.sessions &&
                sprint.sessions.filter((s) => s.price && s.price > 0).length >
                  0 && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                        Select Individual Sessions
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        Choosing an individual session will deselect the bundle
                        tier.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {sprint.sessions
                        .filter((s) => s.price && s.price > 0)
                        .map((session, index) => {
                          const isSelected = selectedAddonIds.includes(
                            session.id
                          );
                          return (
                            <div
                              key={session.id}
                              onClick={() => toggleAddon(session.id)}
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-xl border-2 p-3.5 transition",
                                isSelected
                                  ? "border-[#ff5e14] bg-orange-50/10"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // toggled by parent div
                                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#ff5e14] focus:ring-[#ff5e14]"
                                />
                                <div>
                                  <h5 className="text-xs font-bold text-gray-900">
                                    Session {index + 1}: {session.title}
                                  </h5>
                                  <p className="text-[10px] text-gray-500">
                                    {session.description}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                {isDuoActive ? (
                                  <>
                                    <span className="block text-xs font-bold text-[#ff5e14]">
                                      + ₹
                                      {Math.round((session.price || 0) * 0.8)}
                                    </span>
                                    <span className="block text-[10px] text-gray-400 line-through">
                                      ₹{session.price}
                                    </span>
                                    <span className="block text-[9px] font-medium text-emerald-600">
                                      ≈ ₹
                                      {Math.round(
                                        ((session.price || 0) * 0.8) / 2
                                      )}
                                      /head
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="block text-xs font-bold text-[#ff5e14]">
                                      + ₹{session.price}
                                    </span>
                                    {session.originalPrice &&
                                      session.originalPrice >
                                        (session.price || 0) && (
                                        <span className="block text-[10px] text-gray-400 line-through">
                                          ₹{session.originalPrice}
                                        </span>
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
              {/* {sprint.showAddonsCheckout !== false && liveToolkits && liveToolkits.filter(t => t.id !== sprint.toolkitId).length > 0 && (
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
              )} */}

              {/* Coupon Code */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Discount Coupon
                </h4>
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
                      className="w-full rounded-lg border px-3 py-2 pr-10 text-sm uppercase"
                    />
                    {couponCode && (
                      <button
                        type="button"
                        onClick={() => {
                          setCouponCode("");
                          setCouponDiscount(0);
                          setCouponError("");
                        }}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
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
                        const response = await axios.post(
                          `/api/sprints/${sprint.id}/checkout`,
                          {
                            selectedTierId: selectedTierId || null,
                            selectedAddOnIds: selectedAddonIds,
                            selectedToolkitIds: selectedToolkitIds,
                            buyerName,
                            buyerEmail,
                            buyerPhone: "",
                            buddyEmail: buddyEmail || null,
                            couponCode: couponCode.trim(),
                            validateCouponOnly: true,
                          }
                        );
                        if (response.data.discountAmount) {
                          setCouponDiscount(response.data.discountAmount);
                          toast.success(
                            `Coupon applied! ₹${response.data.discountAmount} discount`
                          );
                        } else {
                          setCouponError("Invalid or expired coupon");
                          setCouponDiscount(0);
                        }
                      } catch (err: any) {
                        setCouponError(
                          err.response?.data?.error || "Invalid coupon"
                        );
                        setCouponDiscount(0);
                      } finally {
                        setIsApplyingCoupon(false);
                      }
                    }}
                    disabled={isApplyingCoupon}
                    className="rounded-lg bg-[#ff5e14] px-4 py-2 text-sm font-medium text-white hover:bg-[#e04f0f] disabled:opacity-50"
                  >
                    {isApplyingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500">{couponError}</p>
                )}
                {couponDiscount > 0 && (
                  <p className="text-xs font-medium text-green-600">
                    Coupon applied: ₹{couponDiscount} discount
                  </p>
                )}
              </div>

              {/* Buyer Contact info */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Contact Details
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Enter name"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="Enter email"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="hidden">{/* buddy email moved to top */}</div>
                </div>
              </div>
            </div>

            {/* Bottom Checkout Action */}
            <div className="flex shrink-0 items-center justify-between border-t bg-gray-50 p-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase">
                  Payable Price
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-lg font-black text-gray-900">
                    ₹{runningTotal}
                  </span>
                  {couponDiscount > 0 && (
                    <>
                      <span className="text-xs font-medium text-gray-400 line-through">
                        ₹{totalOriginalPrice}
                      </span>
                      <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-green-600">
                        Coupon Applied
                      </span>
                    </>
                  )}
                  {totalOriginalPrice > runningTotal &&
                    couponDiscount === 0 && (
                      <>
                        <span className="text-xs font-medium text-gray-400 line-through">
                          ₹{totalOriginalPrice}
                        </span>
                        {sprint.showEarlyBirdCheckout && (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-blue-600">
                            Early Bird offer
                          </span>
                        )}
                      </>
                    )}
                  {totalOriginalPrice <= runningTotal &&
                    isDuoActive &&
                    (selectedTierId || selectedAddonIds.length > 0) &&
                    couponDiscount === 0 && (
                      <span className="text-xs font-medium text-gray-400 line-through">
                        ₹
                        {selectedTierId
                          ? (baseOriginalPrice > basePrice
                              ? baseOriginalPrice * 2
                              : basePrice * 2) + toolkitsTotal
                          : (sessionsOriginalTotal > sessionsTotal
                              ? sessionsOriginalTotal * 2
                              : sessionsTotal * 2) + toolkitsTotal}
                      </span>
                    )}
                </div>
                {isDuoActive &&
                  (selectedTierId || selectedAddonIds.length > 0) && (
                    <span className="mt-0.5 text-[10px] font-semibold text-emerald-600">
                      ≈ ₹
                      {Math.round(
                        (selectedTierId ? finalBasePrice : finalSessionsTotal) /
                          2
                      ) + Math.round(toolkitsTotal / 2)}{" "}
                      per person (Duo Discount Applied)
                    </span>
                  )}
                {!(selectedTierId || selectedAddonIds.length > 0) && (
                  <span className="mt-0.5 text-[9px] font-semibold text-red-500">
                    Please select a tier or session
                  </span>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={
                  isProcessingCheckout ||
                  !(selectedTierId || selectedAddonIds.length > 0)
                }
                className="flex items-center gap-1.5 rounded-xl bg-black px-6 py-3 text-xs font-bold text-white shadow transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessingCheckout ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                    Verifying...
                  </>
                ) : (
                  <>
                    Confirm &amp; Checkout{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Floating Limited Seats Notification */}
      {showSeatsPop && (
        <div className="animate-in slide-in-from-top-5 fixed top-4 right-4 z-50 flex max-w-xs items-center justify-between gap-3 rounded-xl border border-orange-400/30 bg-gradient-to-r from-[#ff5e14] to-orange-600 p-3.5 text-white shadow-2xl duration-300">
          <div>
            <p className="mb-1 text-[9px] leading-none font-bold tracking-widest text-orange-200 uppercase">
              Attention
            </p>
            <h4 className="text-xs leading-snug font-extrabold md:text-sm">
              Limited Seats! Sprint is Live
            </h4>
          </div>
          <button
            onClick={() => setShowSeatsPop(false)}
            className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
