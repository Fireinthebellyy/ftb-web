"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChartColumnBig,
  Code,
  Compass,
  Database,
  LockOpen,
  Megaphone,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Inter, Plus_Jakarta_Sans, Righteous } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
});

const offerings = [
  { title: "Opportunities", icon: Compass, image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop" },
  { title: "Internships", icon: BriefcaseBusiness, image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=600&fit=crop" },
  { title: "Tracker", icon: ChartColumnBig, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=600&fit=crop" },
  { title: "Toolkit", icon: Wrench, image: "https://images.unsplash.com/photo-1581291518629-4c1266205cd4?w=400&h=600&fit=crop" },
  { title: "Ungatekeep", icon: LockOpen, image: "https://images.unsplash.com/photo-1542626991-cbc4e32524cc?w=400&h=600&fit=crop" },
];

const benefits = [
  {
    image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&h=400&fit=crop",
    alt: "Feature Poster 1"
  },
  {
    image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&h=400&fit=crop",
    alt: "Feature Poster 2"
  },
  {
    image: "https://images.unsplash.com/photo-1614850523598-8442b85d5e7a?w=800&h=400&fit=crop",
    alt: "Feature Poster 3"
  }
];

const toolkits = [
  {
    title: "Design Masterclass",
    description: "From Figma basics to high-fidelity prototyping.",
    modules: "12 Modules",
    icon: Sparkles,
  },
  {
    title: "Product Engineering",
    description: "Full stack development for future founders.",
    modules: "8 Modules",
    icon: Code,
  },
  {
    title: "Growth Marketing",
    description: "The science behind building a viral presence.",
    modules: "10 Modules",
    icon: Megaphone,
  },
  {
    title: "Data Analytics",
    description: "Make decisions driven by data, not gut feelings.",
    modules: "15 Modules",
    icon: Database,
  },
];

export default function LandingPage() {
  const [currentBenefit, setCurrentBenefit] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBenefit((prev) => (prev + 1) % benefits.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`${plusJakarta.className} bg-white text-neutral-900`}>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Force row layout with inline style to guarantee left-right on all screen sizes */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          {/* Mascot — fixed height to match carousel */}
          <div style={{ flexShrink: 0, height: "220px" }} className="sm:h-[260px] md:h-[300px]">
            <img
              alt="Fire in the Belly Penguin Mascot"
              className="h-full w-auto object-contain transition-transform hover:scale-105"
              src="/images/pingo.jpeg"
            />
          </div>

          {/* Carousel Poster — capped to same height */}
          <div style={{ flex: 1, minWidth: 0, maxWidth: "560px" }}>
            <div className="w-full overflow-hidden rounded-xl bg-neutral-100 shadow-sm md:rounded-3xl" style={{ height: "220px" }} >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBenefit}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full w-full"
                >
                  <img 
                    src={benefits[currentBenefit].image} 
                    alt={benefits[currentBenefit].alt}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div className="mt-2 flex gap-1.5 sm:mt-4 sm:gap-2">
              {benefits.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBenefit(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentBenefit ? "w-4 bg-primary sm:w-8" : "w-1 bg-primary/20 sm:w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className={`${righteous.className} text-3xl sm:text-5xl md:text-6xl leading-tight tracking-normal text-neutral-900`}>
            Turning 20&apos;s <span className="text-neutral-400">SUFFER</span> into <span className="text-primary uppercase">SAFFAR</span>
          </h2>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <h2 className="mb-8 text-sm font-bold tracking-[0.16em] text-primary uppercase">
            Offerings
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-6 md:grid md:grid-cols-6 lg:grid-cols-6">
            {offerings.map((item) => (
              <div
                key={item.title}
                className="group relative aspect-[2/3] w-32 min-w-[128px] cursor-pointer overflow-hidden rounded-lg border border-neutral-100 bg-neutral-900 shadow-sm transition-transform hover:scale-105 sm:w-40 sm:min-w-[160px]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-wider sm:text-xs">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white py-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6">
          <p className="mb-8 text-center text-sm font-medium text-neutral-400">
            TRUSTED BY AMBITIOUS STUDENTS FROM
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-30 grayscale sm:gap-x-12">
            {[
              "GOOGLE",
              "META",
              "STRIPE",
              "MICROSOFT",
              "APPLE",
              "NOTION",
            ].map((brand) => (
              <div key={brand} className="text-xl font-black sm:text-2xl">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-black py-10 text-white sm:py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-5 flex items-end justify-between sm:mb-6">
            <div>
              <h2 className="mb-3 text-3xl font-bold text-white sm:mb-4 sm:text-4xl">
                Trending Toolkits
              </h2>
              <p className="text-white/60">
                Everything you need to master your niche.
              </p>
            </div>
            <Link
              className="flex items-center gap-1 font-bold text-primary hover:underline"
              href="/toolkit"
            >
              See all <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="hide-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:gap-6 sm:px-6 sm:pb-8">
            {toolkits.map((toolkit) => {
              const Icon = toolkit.icon;
              return (
                <div
                  key={toolkit.title}
                  className="min-w-[260px] cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-7 transition-colors hover:bg-white/10 sm:min-w-[280px] sm:p-8"
                >
                  <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-primary/20">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold break-words">
                    {toolkit.title}
                  </h3>
                  <p className="mb-6 text-sm break-words opacity-60">
                    {toolkit.description}
                  </p>
                  <span
                    className={`${inter.className} text-xs font-bold tracking-[0.14em] text-primary uppercase`}
                  >
                    {toolkit.modules}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-5 flex items-end justify-between sm:mb-6">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">
              Best of #FTB UnGateKeep
            </h2>
            <Link
              className="flex items-center gap-1 font-bold text-primary hover:underline"
              href="/ungatekeep"
            >
              See all <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 md:grid md:grid-cols-6 lg:grid-cols-6">
            {[
              {
                title: "Design Insider",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHjlCpXTZGQxpgr6RdDsG9zZ7SZ3jYqGaxhTTx80bdcxCnSAl1PCw3gI4YPXaZ9QEqPgHR2YZJkr8GqTGx1z9TvKl0N571aOdIEigqAlo1xhplZRvhPo5FVwugiumfZohKDGxEat8tfravys9grDrhAMa5rFZrzuTgkhT1L2Z3aN14k3UMyoZfTn7g65kyO-1dHH5jRK9Hwzx9nPY6XCNCHAGfYdrkiy41SLkMqI4f2dP2YJzvb_5XM1DNd70lhQz2-4ti6q5Bdw",
              },
              {
                title: "VC Decoding",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8iapg1h3AKWhpcHf02ckboNzKRNEL6toVT5LAi8jcKulGm7aVhrPluri4S7dd8QU63S7TuQooGWTSrB48EncQhwDzInDTSwKmlL-rpsV01FC03z6M-WUlUEZsiahI1U5dF06J4fwGs7SG22jxCpoKJdRSJUvpvFZ4swDebBUDRBG_EtZd0H3596f-keMl9iE-GdEaGHtxJcNX8AvBj_f233mwCIzYZywv9kE7I4JY5K1DpVfMC1S6hwpqWDW_bx1ykU_ia4-T9g",
              },
              {
                title: "Startup Blueprint",
                image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=600&fit=crop",
              },
              {
                title: "Tech Recruiting",
                image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=600&fit=crop",
              },
            ].map((card, idx) => (
              <div key={idx} className="group relative aspect-[2/3] w-32 min-w-[128px] cursor-pointer overflow-hidden rounded-lg bg-neutral-900 shadow-md transition-transform hover:scale-105 sm:w-40 sm:min-w-[160px]">
                <img
                  alt={card.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-90"
                  src={card.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider sm:text-xs">
                    {card.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-5 flex items-end justify-between sm:mb-6">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">
              Internships
            </h2>
            <a
              className="flex items-center gap-1 font-bold text-[var(--color-primary)] hover:underline"
              href="#"
            >
              See all <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:gap-8 md:overflow-visible">
            <div className="w-[78vw] shrink-0 cursor-pointer rounded-[2rem] border border-neutral-100 bg-neutral-50 p-6 transition-all hover:border-primary/20 md:w-auto">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-primary shadow-sm">
                  VRCL
                </div>
                <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-bold text-primary">
                  New
                </span>
              </div>
              <h4 className="mb-2 text-xl font-bold">
                Vercel: Frontend Fellow
              </h4>
              <p className="mb-6 text-sm text-neutral-600">
                Work directly with the Core Team on Next.js features. Remote/Global.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold opacity-60">12 Weeks</div>
                <Button className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white">
                  Apply Now
                </Button>
              </div>
            </div>

            <div className="w-[78vw] shrink-0 cursor-pointer rounded-[2rem] border border-neutral-100 bg-neutral-50 p-6 transition-all hover:border-primary/20 md:w-auto">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-primary shadow-sm">
                  NOTN
                </div>
                <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-bold text-primary">
                  Remote
                </span>
              </div>
              <h4 className="mb-2 text-xl font-bold">
                Notion: Campus Lead
              </h4>
              <p className="mb-6 text-sm text-neutral-600">
                Build community and influence on your campus. High growth potential.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold opacity-60">Stipend + Swag</div>
                <Button className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white">
                  Apply Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex items-end justify-between sm:mb-12">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">
              Talk of the Hour in Opportunities
            </h2>
            <a
              className="flex items-center gap-1 font-bold text-primary hover:underline"
              href="#"
            >
              See all <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 md:grid md:grid-cols-6 lg:grid-cols-6">
            {[
              { title: "Stripe AE", image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=600&fit=crop" },
              { title: "MS Resident", image: "https://images.unsplash.com/photo-1593642532400-2682810df593?w=400&h=600&fit=crop" },
              { title: "Apple Ops", image: "https://images.unsplash.com/photo-1517245318728-4903328e13fe?w=400&h=600&fit=crop" },
              { title: "Meta Analyst", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop" },
              { title: "Notion Community", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=600&fit=crop" },
            ].map((opp, idx) => (
              <div key={idx} className="group relative aspect-[2/3] w-32 min-w-[128px] cursor-pointer overflow-hidden rounded-lg bg-neutral-900 shadow-md transition-transform hover:scale-105 sm:w-40 sm:min-w-[160px]">
                <img
                  src={opp.image}
                  alt={opp.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider sm:text-xs">
                    {opp.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <h2 className="mb-6 text-center text-3xl font-bold text-primary sm:mb-8 sm:text-4xl">
            Frequently Asked Queries
          </h2>
          <div className="space-y-4">
            {[
              "Is it free to use?",
              "What is included in the Paid plan?",
              "How often are opportunities updated?",
              "Do you offer 1-on-1 coaching?",
            ].map((question) => (
              <div
                key={question}
                className="overflow-hidden rounded-2xl border border-transparent bg-neutral-50 transition-all hover:border-primary/20"
              >
                <button className="group flex w-full items-center justify-between px-6 py-5 text-left sm:px-8 sm:py-6">
                  <h4 className="text-base font-bold break-words transition-colors group-hover:text-primary sm:text-lg">
                    {question}
                  </h4>
                  <span className="text-2xl leading-none text-primary transition-transform group-hover:rotate-45">
                    +
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Footer removed as per request */}
    </div>
  );
}
