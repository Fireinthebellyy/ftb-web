"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Inter, Outfit, Satisfy } from "next/font/google";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import HomeInternshipCardsSection from "@/components/internship/HomeInternshipCardsSection";
import HomeOpportunitiesSection from "@/components/opportunity/HomeOpportunitiesSection";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";
import { getYouTubeThumbnailUrl } from "@/lib/youtube";
import { Toolkit } from "@/types/interfaces";
import { startToolkitCheckout } from "@/lib/toolkit-checkout";


const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const satisfy = Satisfy({
  subsets: ["latin"],
  weight: ["400"],
});

const sfProClass = inter.className;

interface UngatekeepHomePost {
  id: string;
  attachments: string[];
  videoUrl?: string | null;
  is_featured_home?: boolean;
}

interface UngatekeepHomeResponse {
  posts: UngatekeepHomePost[];
}

function HeroSection() {
  return (
    <section className="px-4 py-4 md:px-8 md:py-8">
      <div className="flex flex-col items-center gap-2">
        <div className="flex w-full flex-col items-center gap-4 px-0 pt-[10px] pb-[10px] text-center">
          <h1 className={`${outfit.className} max-w-[408px] text-[44px] leading-[50px] font-bold tracking-[-2.25px] text-black md:max-w-[820px] md:text-[68px] md:leading-[72px]`}>
            Everything you need to get ahead.
            <br />
            {"Finally,\u00A0in\u00A0one\u00A0place."}
          </h1>
          <p className={`${inter.className} max-w-[330px] text-center text-2xl leading-8 font-normal tracking-[-0.25px] text-black/50 md:max-w-[760px] md:text-[30px] md:leading-[38px]`}>
            So you stop missing out and start making smarter moves.
          </p>
        </div>

        <div className="relative h-[256px] w-[282px] max-w-full md:h-[420px] md:w-[500px]">
          <Image src="/images/pingo.png" alt="Hero visual" fill priority sizes="(min-width: 768px) 500px, 282px" className="object-contain object-top" />
        </div>
      </div>
    </section>
  );
}

function TaglineSection() {
  return (
    <section className="px-4 pt-4 pb-0 md:px-8 md:pt-6">
      <h2 className="px-[10px] text-center text-[40px] leading-10 tracking-[-2.25px] md:text-[64px] md:leading-[64px]">
        <span className={`${outfit.className} font-bold text-[rgba(0,0,0,0.8)]`}>Turning your</span>
        <span className={`${satisfy.className} text-[#ff6e00]`}> 20&rsquo;s ka suffer</span>
        <span className={`${outfit.className} font-bold text-[rgba(0,0,0,0.8)]`}> into </span>
        <span className={`${satisfy.className} lowercase text-[#ff6e00]`}>सफ़र</span>
      </h2>
    </section>
  );
}

function InternshipStripClient() {
  const [activeSlide, setActiveSlide] = useState(0);
  const internshipStackImages = ["/images/internship2.jpeg", "/images/internship3.jpeg", "/images/internship.jpeg"];

  const slides = [
    {
      key: "internships",
      title: "Internships",
      description: "Apply smarter, track everything & add to calendar - hit the golden window",
      leftImage: "/images/internship.png",
      leftMode: "badge",
    },
    {
      key: "toolkits",
      title: "Toolkits",
      description: "Cold emails, interviews & case comps - mastered with playbooks that ACTUALLY work.",
      leftImage: "/images/toolkit-left.png",
      leftMode: "cover",
    },
    {
      key: "opportunities",
      title: "Opportunities",
      description: "Discover & never ever miss a deadline - hackathons, competitions, fellowships & more",
      leftImage: "/images/opportunities-graphics.png",
      leftMode: "cover",
    },
    {
      key: "ungatekeep",
      title: "Ungatekeep",
      description: "Zero gatekeeping - just recommendations & real answers to college AMAs",
      leftImage: "/images/ungatekeep-left.png",
      leftMode: "cover",
    },
  ] as const;

  const goToPrevious = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="-mx-4 pt-4 pb-4 md:mx-0 md:px-8 md:py-8">
      <div className="mx-auto w-[390px] overflow-hidden md:w-[680px]">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <article key={slide.key} className="w-[390px] shrink-0 md:w-[680px]">
              <div className="mx-auto h-[240px] w-[390px] rounded-2xl border border-black/30 bg-white p-[10px] md:h-[320px] md:w-[660px] md:rounded-[24px] md:p-4">
                <div className="grid h-full grid-cols-[160px_200px] gap-[10px] md:grid-cols-[280px_332px] md:gap-4">
                  {slide.leftMode === "badge" ? (
                    <div className="relative h-[220px] w-[160px] overflow-hidden rounded-2xl bg-white md:h-[288px] md:w-[280px]">
                      <div className="flex h-full w-full flex-col">
                          {internshipStackImages.map((src, index) => (
                            <div key={`${src}-${index}`} className="relative min-h-0 h-1/3 animate-internship-stack">
                              <Image
                                src={src}
                                alt={`${slide.title} visual ${index + 1}`}
                                fill
                                quality={95}
                                sizes="(min-width: 768px) 280px, 160px"
                                className="object-contain"
                              />
                            </div>
                          ))}
                        </div>
                    </div>
                  ) : (
                    <div className="relative h-[220px] w-[160px] overflow-hidden rounded-2xl md:h-[288px] md:w-[280px]">
                      <Image src={slide.leftImage} alt={`${slide.title} visual`} fill className={slide.key === "toolkits" ? "object-contain" : "object-cover"} />
                    </div>
                  )}

                  <div className="flex h-[220px] flex-col border border-black/30 bg-white p-3 md:h-[288px] md:p-5">
                    <div className="mb-2 flex justify-end md:mb-4">
                      <div className="relative size-[50px] overflow-hidden md:size-[72px]">
                        <Image src="/images/ftb-seal.png" alt="icon" fill className="object-contain" />
                      </div>
                    </div>

                    <div className="mt-1 rounded-2xl px-1 text-center">
                      <h3 className={`${outfit.className} text-[20px] leading-[25px] font-medium text-black md:text-[32px] md:leading-[36px]`}>{slide.title}</h3>
                      <p className={`${sfProClass} mt-2 text-[16px] leading-4 text-black/50 md:text-[20px] md:leading-[24px]`}>{slide.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-[16.74px]">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={goToPrevious}
          className="grid size-[46px] place-items-center rounded-full border border-black/20 bg-white text-[#ff6e00]"
        >
          <ChevronLeft className="size-[30px]" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={goToNext}
          className="grid size-[46px] place-items-center rounded-full border border-black/20 bg-white text-[#ff6e00]"
        >
          <ChevronRight className="size-[30px]" />
        </button>
      </div>
    </section>
  );
}

const InternshipStrip = dynamic(async () => InternshipStripClient, {
  ssr: false,
});

function TrustedSection() {
  const logos = ["/images/du.png", "/images/christ.jpg", "/images/manipal.png", "/images/srcc.png", "/images/ssc.png", "/images/bhu.png", "/images/iim.jpg"];

  return (
    <section className="px-4 pb-0">
      <div className="rounded-2xl bg-white p-4">
        <div className="mx-auto w-fit text-center">
          <p className={`${outfit.className} text-[12px] text-black/50`}>Rated</p>
          <p className={`${outfit.className} text-[40px] leading-[50px] font-bold text-black`}>4.8/5</p>
        </div>
        <p className={`${sfProClass} mt-2 text-center text-[16px] leading-normal`}>
          <span className="font-normal text-[rgba(0,0,0,0.5)]">
            Trusted by ambitious students &amp; early career professionals from across
          </span>
          <span className="font-medium text-[rgba(0,0,0,0.8)]"> </span>
          <span className="font-semibold text-[rgba(0,0,0,0.6)]">Delhi University | Christ University | IIITs | IIMs | BHU</span>
        </p>

        <div className="relative mt-2 overflow-hidden">
          <div className="animate-marquee-logo flex w-max items-center" style={{ animation: "marquee-left 14s linear infinite", willChange: "transform" }}>
            <div className="flex shrink-0 items-center gap-8">
              {logos.map((logo, index) => (
                <div key={`logo-${index}`} className="relative h-[81px] w-[70px] shrink-0">
                  <Image src={logo} alt="University logo" fill className="object-contain" />
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-8" aria-hidden="true">
              {logos.map((logo, index) => (
                <div key={`logo-dup-${index}`} className="relative h-[81px] w-[70px] shrink-0">
                <Image src={logo} alt="University logo" fill className="object-contain" />
              </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function useDragMarquee() {
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);

  const cleanupDrag = (pointerId?: number) => {
    const el = containerRef.current;
    isDown.current = false;
    if (el && pointerId !== undefined) {
      try {
        el.releasePointerCapture(pointerId);
      } catch {}
    }
    setPaused(false);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    isDown.current = true;
    try {
      el.setPointerCapture?.(e.pointerId);
    } catch {}
    startX.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;
    setPaused(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDown.current || !containerRef.current) return;
    const walk = e.clientX - startX.current;
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    cleanupDrag(e.pointerId);
  };

  const onPointerLeave = () => {
    cleanupDrag();
  };

  const onPointerCancel = () => {
    cleanupDrag();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const viewportStep = Math.max(120, Math.round(el.clientWidth * 0.8));

    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      setPaused(true);
      el.scrollBy({ left: viewportStep, behavior: "smooth" });
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      setPaused(true);
      el.scrollBy({ left: -viewportStep, behavior: "smooth" });
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      setPaused(true);
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      setPaused(true);
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }
  };

  const onBlur = () => {
    cleanupDrag();
  };

  return {
    paused,
    setPaused,
    containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onKeyDown,
    onBlur,
  };
}

function ToolkitCarousel() {
  const [processingToolkitId, setProcessingToolkitId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).Razorpay) return;

    const selector = 'script[src="https://checkout.razorpay.com/v1/checkout.js"]';
    if (document.querySelector(selector)) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const { data: toolkits = [] } = useQuery<Toolkit[]>({
    queryKey: ["toolkits"],
    queryFn: async () => {
      const response = await axios.get<Toolkit[]>("/api/toolkits");
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const featuredToolkits = toolkits.filter((t: any) => t.is_featured_home);
  const toolkitCards = featuredToolkits.slice(0, 6);
  const shouldShowComingSoon = toolkitCards.length < 2;

  const router = useRouter();

  const handleBuyNow = async (toolkitId: string) => {
    setProcessingToolkitId(toolkitId);

    try {
      await startToolkitCheckout(toolkitId, (path) => {
        window.location.href = path;
      });
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setProcessingToolkitId(null);
    }
  };

  return (
    <section className="mt-0 bg-black px-4 pt-2 pb-2 md:px-8 md:py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className={`${outfit.className} text-[30px] leading-[30px] font-medium tracking-[-0.25px] text-white`}>Trending toolkits</h3>
          <p className={`${outfit.className} mt-0 text-[20px] leading-5 tracking-[-0.25px] text-[#ff6e00]/75`}>Built to get you moving &amp; acing</p>
        </div>
        <Link href="/toolkit" className={`${outfit.className} text-[16px] leading-[110px] tracking-[-0.25px] text-[#ff6e00]`}>
          See All
        </Link>
      </div>

      <div className="hide-scrollbar overflow-x-auto pb-2">
        <div className="flex w-max gap-2">
          {toolkitCards.map((card, index) => (
            <article
              key={`${card.id}-${index}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" && card.id) {
                  router.push(`/toolkit/${card.id}`);
                }
              }}
              onClick={() => {
                if (card.id) router.push(`/toolkit/${card.id}`);
              }}
              className="relative mt-2 flex h-[270px] w-[218px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/50 px-0 py-0 md:h-[340px] md:w-[280px] md:px-0 md:py-0"
            >
              {card.coverImageUrl || card.bannerImageUrl ? (
                <>
                  <Image
                    src={card.coverImageUrl ?? card.bannerImageUrl!}
                    alt={card.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 218px, 280px"
                  />
                  <div className="absolute inset-0 bg-black/45" />
                </>
              ) : null}

              <div className="relative z-10 flex flex-1 items-end justify-between gap-[10px] px-4 py-4 md:px-5 md:py-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (card.id) {
                      void handleBuyNow(card.id);
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (card.id && processingToolkitId !== card.id) {
                      void handleBuyNow(card.id);
                    }
                  }}
                  disabled={!card.id || processingToolkitId === card.id}
                  className={`${outfit.className} inline-flex h-12 touch-manipulation items-center justify-center whitespace-nowrap rounded-[39px] bg-white px-3 text-[18px] leading-none font-medium tracking-[-0.25px] text-black disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {processingToolkitId === card.id ? "Processing..." : "Buy now"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (card.id) router.push(`/toolkit/${card.id}`);
                  }}
                  className={`${sfProClass} inline-flex h-12 items-center justify-center whitespace-nowrap rounded-[39px] border border-white/50 px-3 text-[18px] leading-none font-normal tracking-[-0.25px] text-white/50`}
                >
                  Explore
                </button>
              </div>
            </article>
          ))}

          {shouldShowComingSoon ? (
            <Link
              href="/toolkit"
              aria-label="See all toolkits"
              className="relative mt-2 block h-[270px] w-[218px] shrink-0 overflow-hidden rounded-2xl border border-dashed border-white/60 bg-white/5 cursor-pointer md:h-[340px] md:w-[280px]"
            >
              <Image
                src="/images/toolkit-comingsoon.png"
                alt=""
                fill
                sizes="(max-width: 768px) 218px, 280px"
                className="object-cover opacity-65"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-black/35" />

              <div className="absolute left-0 right-0 bottom-4 z-10 px-4 text-center md:bottom-6">
                <p className={`${outfit.className} text-[20px] md:text-[24px] leading-[30px] font-medium tracking-[-0.25px] text-white`}>
                  Coming Soon
                </p>
                <p className={`${sfProClass} mt-1 text-[14px] md:text-[20px] leading-[20px] text-white/80`}>
                  See all
                </p>
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface CardCarouselSectionProps {
  title: string;
  subtitle: string;
  href: string;
  spacing?: "featured" | "compact";
}

function CardCarouselSection({
  title,
  subtitle,
  href,
  spacing = "compact",
}: CardCarouselSectionProps) {
  const stackGapClass = spacing === "featured" ? "gap-8" : "gap-4";
  const titleClass =
    spacing === "featured"
      ? `${outfit.className} text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`
      : `${outfit.className} whitespace-pre-line md:whitespace-nowrap text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`;
  const subtitleClass =
    spacing === "featured"
      ? `${outfit.className} w-full text-[20px] leading-5 tracking-[-0.25px] text-black/50`
      : `${outfit.className} whitespace-nowrap text-[20px] leading-5 tracking-[-0.25px] text-black/50`;

  return (
    <section className="bg-white px-4 py-4 md:px-8 md:py-6">
      <div className={`flex flex-col ${stackGapClass}`}>
        <div className="relative space-y-2 text-center">
          <div className="space-y-2">
            <h3 className={titleClass}>{title}</h3>
            <p className={subtitleClass}>{subtitle}</p>
          </div>

          <Link href={href} className={`${sfProClass} hidden whitespace-nowrap text-[16px] leading-[30px] font-medium tracking-[-1px] text-[#ff6e00] md:absolute md:top-0 md:right-0 md:inline-block`}>
            See All
          </Link>
        </div>

        <MarqueeLikeCards />

        <Link href={href} className={`${sfProClass} text-left text-[16px] leading-[30px] font-medium tracking-[-1px] text-[#ff6e00] md:hidden`}>
          See All
        </Link>
      </div>
    </section>
  );
}

function MarqueeLikeCards() {
  const [failedPostIds, setFailedPostIds] = useState<Set<string>>(new Set());

  const { data, isPending, isError } = useQuery<UngatekeepHomeResponse>({
    queryKey: ["home-ungatekeep-posts"],
    queryFn: async () => {
      const response = await axios.get<UngatekeepHomeResponse>("/api/ungatekeep?page=1&limit=50");
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const posts = data?.posts ?? [];
  const featuredPosts = posts.filter((post: any) => post.is_featured_home);
  const sourcePosts = featuredPosts.length > 0 ? featuredPosts : posts;
  const cardsWithMedia = sourcePosts
    .map((post) => {
      const videoThumbnail = getYouTubeThumbnailUrl(post.videoUrl);
      const firstImage = post.attachments?.[0]
        ? tryGetStoragePublicUrl("ungatekeep-images", post.attachments[0])
        : null;
      const cardGraphic = videoThumbnail ?? firstImage;

      if (!cardGraphic) {
        return null;
      }

      return {
        id: post.id,
        cardGraphic,
      };
    })
    .filter(
      (card): card is { id: string; cardGraphic: string } =>
        card !== null && !failedPostIds.has(card.id)
    );
  const shouldShowComingSoon = !isPending && !isError && cardsWithMedia.length < 2;

  const {
    containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onKeyDown,
    onBlur,
  } = useDragMarquee();

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Ungatekeep and internship cards carousel. Use arrow keys to scroll."
      className="hide-scrollbar mt-[6px] overflow-x-auto"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <div role="list" className="flex w-max gap-4">
        {cardsWithMedia.map((card, index) => (
          <Link
            key={card.id}
            href={`/ungatekeep/${card.id}`}
            aria-label={`Open ungatekeep post ${index + 1}`}
            className="relative h-[199px] w-[160px] shrink-0 overflow-hidden rounded-2xl border border-black/20 md:h-[280px] md:w-[240px]"
          >
            <Image
              src={card.cardGraphic}
              alt={`Ungatekeep post ${index + 1}`}
              fill
              className="object-cover"
              unoptimized={true}
              onError={() => setFailedPostIds((prev) => (prev.has(card.id) ? prev : new Set(prev).add(card.id)))}
            />
          </Link>
        ))}
        {shouldShowComingSoon ? (
          <article className="flex h-[199px] w-[160px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-black/25 bg-black/[0.03] px-4 text-center md:h-[280px] md:w-[240px]">
            <p className={`${outfit.className} text-[20px] leading-[24px] font-medium tracking-[-0.25px] text-black/80 md:text-[24px] md:leading-[30px]`}>Coming Soon</p>
            <p className={`${sfProClass} mt-1 text-[14px] leading-[18px] text-black/60 md:text-[16px] md:leading-[22px]`}>Stay Tuned!</p>
          </article>
        ) : null}
      </div>
    </div>
  );
}

function FaqSection() {
  const faqs = [
    {
      question: "What exactly is FTB?",
      answer:
        "FTB is an all-in-one platform for ambitious students across India to discover, track, and apply smarter to legit internships and opportunities. Beyond access, we solve for clarity - with Ungatekeep content and toolkits designed to give you an unfair advantage.",
    },
    {
      question: "Who is FTB for?",
      answer: "Students and early professionals in their 20s who want clarity, direction, and real opportunities to grow.",
    },
    {
      question: "How do I actually use FTB to get ahead?",
      answer: "Explore opportunities, save the ones that fit you, track deadlines, and use toolkits to apply smarter and improve your chances.",
    },
    {
      question: "What kind of opportunities can I find here?",
      answer: "Internships, case competitions, hackathons, fellowships, scholarships, and more - across multiple domains.",
    },
    {
      question: "What is the \"Smart Apply\" feature?",
      answer: "It helps you save, track, and manage your applications in one place - so you never miss the right moment to apply.",
    },
    {
      question: "What are Toolkits? Are they worth it?",
      answer: "Toolkits are step-by-step playbooks to help you land and crack opportunities. If you want to stop guessing and start getting results - they are worth it.",
    },
    {
      question: "What is Ungatekeep?",
      answer: "Everything students usually figure out too late - shared early. From cold emails to interview scripts, real answers and insider breakdowns.",
    },
    {
      question: "Are these opportunities verified?",
      answer: "Yes - opportunities are curated and verified by our team, along with trusted submissions from organizations and communities.",
    },
    {
      question: "Can I intern with FTB or get involved?",
      answer: "Yes! We are always looking for driven people to join us. Keep an eye on openings or reach out - we would love to hear from you.",
    },
    {
      question: "Can I connect 1:1 for guidance or queries?",
      answer:
        "Yes - through mentorship sessions and community support (rolling out soon). You will also find answers through toolkits and Ungatekeep content.",
    },
    {
      question: "How can I share feedback or a testimonial?",
      answer: "We would love that. You can share feedback directly on the platform or reach out to us - we are always building with our users.",
    },
  ];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white px-4 py-4 md:px-8 md:py-8">
      <div className="space-y-1 text-center">
        <h3 className={`${outfit.className} text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`}>
          Frequently Asked Questions
        </h3>
        <p className={`${outfit.className} whitespace-nowrap text-[20px] leading-5 tracking-[-0.25px] text-[#ff6e00]/75`}>#beeninyourshoes</p>
      </div>

      <div className="mt-4">
        {faqs.map((item, index) => (
          <div key={`${item.question}-${index}`} className="rounded-none px-4 py-4">
            <button
              type="button"
              onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              className="flex w-full items-center justify-between"
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <p className={`${outfit.className} flex-1 pr-3 text-left text-[20px] leading-[30px] font-medium tracking-[-0.25px] text-black/80`}>
                {item.question}
              </p>
              <Plus className={`size-5 shrink-0 text-black/70 transition-transform ${openIndex === index ? "rotate-45" : "rotate-0"}`} />
            </button>
            {openIndex === index ? (
              <p id={`faq-answer-${index}`} className={`${sfProClass} mt-2 pr-8 text-left text-[16px] leading-6 tracking-[-0.25px] text-black/60`}>
                {item.answer}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className={`${outfit.className} min-h-screen bg-white text-black`}>
      <div className="w-full px-4 md:px-0">
        <HeroSection />
        <TaglineSection />

        <InternshipStrip />
        <TrustedSection />
        <ToolkitCarousel />
        <CardCarouselSection
          title="Truly UnGATEKEEPED"
          subtitle="Posting everything students usually figure out too late."
          href="/ungatekeep"
          spacing="featured"
        />
        <HomeInternshipCardsSection outfitClass={outfit.className} sfProClass={sfProClass} />
        <HomeOpportunitiesSection outfitClass={outfit.className} sfProClass={sfProClass} />
        <FaqSection />
      </div>
    </main>
  );
}
