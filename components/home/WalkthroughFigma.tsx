"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Outfit } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "700"] });

const imgVector2 = "https://www.figma.com/api/mcp/asset/4f39ec85-1b73-472e-b637-dd6b6cf499f0";

const walkthroughSteps = [
  {
    path: "/",
    title: "Welcome",
    subtitle: "Your journey starts here.",
    description: "Discover everything you need to get ahead. Let's take a quick tour.",
  },
  {
    path: "/opportunities",
    title: "Opportunities",
    subtitle: "80% of users go through this to understand this platform better.",
    description: "Curated opportunities like fellowships, scholarships, awards and recognitions, competitions across 40+ fields – all in one place.",
  },
  {
    path: "/intern",
    title: "Internships",
    subtitle: "Gain real-world experience.",
    description: "Find and apply for top internships tailored to your profile. Start building your career today.",
  },
  {
    path: "/toolkit",
    title: "Toolkit",
    subtitle: "Everything you need to succeed.",
    description: "Access premium guides, resume templates, and case studies to prepare you for your next big step.",
  },
  {
    path: "/ungatekeep",
    title: "Ungatekeep",
    subtitle: "Learn from the community.",
    description: "Read authentic feedback, interview experiences, and insights from peers who have been there.",
  },
  {
    path: "/tracker",
    title: "Tracker",
    subtitle: "Stay organized.",
    description: "Track your ongoing applications and important deadlines in one manageable dashboard.",
  }
];

export default function WalkthroughFigma({ isDesktop = false }: { isDesktop?: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending } = useSession();
  const [desktopPointerLeft, setDesktopPointerLeft] = useState("calc(50% - 22px)");
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedPathname = pathname === "/" ? "/" : pathname?.replace(/\/+$/, "");

  // Find current step based on route
  const currentStepIndex = walkthroughSteps.findIndex(s => 
    normalizedPathname === s.path || (s.path !== "/" && normalizedPathname?.startsWith(`${s.path}/`))
  );
  const step = currentStepIndex >= 0 ? currentStepIndex : 0;
  const currentData = walkthroughSteps[step];

  useEffect(() => {
    if (!user?.user?.id) return;
    
    // Check if permanently completed for this user
    const completed = localStorage.getItem(`ftb_walkthrough_completed_${user.user.id}`);
    if (completed === "true") {
      setIsVisible(false);
      return;
    }

    if (pathname === "/") {
      // Starting or continuing walkthrough from homepage
      sessionStorage.setItem("ftb_walkthrough_active", "true");
      setIsVisible(true);
    } else {
      // Only show on other tabs if walkthrough is already active in this session
      const isActive = sessionStorage.getItem("ftb_walkthrough_active") === "true";
      setIsVisible(isActive);
    }
  }, [user?.user?.id, pathname]);

  useEffect(() => {
    if (!isDesktop || !containerRef.current) return;
    
    // Allow DOM to settle before calculating
    const timeoutId = setTimeout(() => {
      const path = currentData.path;
      let targetEl: Element | null = null;
      if (path === "/") {
        targetEl = document.querySelector('header a[href="/"]');
      } else {
        targetEl = document.querySelector(`header nav a[href="${path}"]`);
      }

      if (targetEl && containerRef.current) {
        const targetRect = targetEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const offset = (targetRect.left + targetRect.width / 2) - containerRect.left;
        // Clamp the offset to keep the pointer within the card visually
        let clampedOffset = offset - 22;
        clampedOffset = Math.max(16, Math.min(clampedOffset, containerRect.width - 44 - 16));
        setDesktopPointerLeft(`${clampedOffset}px`);
      } else {
        setDesktopPointerLeft("calc(50% - 22px)");
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [step, isDesktop, currentData.path, isVisible]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (isPending || !user) return null;
  if (!isVisible || currentStepIndex === -1) return null;

  const handleNext = () => {
    if (step < walkthroughSteps.length - 1) {
      const nextStep = step + 1;
      router.push(walkthroughSteps[nextStep].path);
    } else {
      setIsVisible(false);
      if (user?.user?.id) {
        localStorage.setItem(`ftb_walkthrough_completed_${user.user.id}`, "true");
      }
      sessionStorage.removeItem("ftb_walkthrough_active");
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    sessionStorage.removeItem("ftb_walkthrough_active");
  };

  const pointerLeft = isDesktop 
    ? desktopPointerLeft
    : `calc(${10 + (step === 0 ? 0 : step - 1) * 20}% - 22px)`; 

  return (
    <>
      {mounted && step === 0 && createPortal(
        <div className="fixed inset-0 z-[40] bg-black/40 backdrop-blur-sm pointer-events-auto" />,
        document.body
      )}
      <div ref={containerRef} className="relative w-full drop-shadow-2xl flex flex-col pointer-events-auto mx-auto max-w-[392px]" style={{touchAction: 'none'}}>
        {isDesktop && step !== 0 && (
          <motion.div 
            animate={{ left: pointerLeft }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute -top-5 w-[44px] h-[22px] pointer-events-none drop-shadow-md z-10"
          >
            <img src={imgVector2} alt="pointer" className="absolute inset-0 h-full w-full object-contain rotate-180" />
          </motion.div>
        )}

        <div className="bg-black rounded-2xl p-[18px] w-[392px] max-w-[calc(100vw-32px)] self-center text-left relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-1 w-full"
            >
              <div className="flex w-full items-end justify-between">
                <div className="flex flex-1 flex-col gap-1">
                  <p className={`${outfit.className} text-[8px] text-[#ff6e00]`}>
                    {currentData.subtitle}
                  </p>
                  <p className={`${outfit.className} text-[26px] leading-[1.1] font-semibold text-white mt-1 tracking-tight`}>
                    {currentData.title}
                  </p>
                </div>
              </div>

              <div className="mt-2 w-full">
                <p className={`${outfit.className} text-[12px] text-white/50 leading-[1.3] pr-4`}>
                  {currentData.description}
                </p>
              </div>
              
              <div className="mt-4 flex items-center gap-2 rounded-full absolute bottom-[22px] left-[18px]" >
                  {walkthroughSteps.map((_, i) => (
                    <motion.span 
                      key={i}
                      animate={{
                        width: i === step ? 16 : 8,
                        backgroundColor: i === step ? "#ff6e00" : "#d9d9d9"
                      }}
                      className="h-2 rounded-full block" 
                    />
                  ))}
              </div>

              <div className="mt-6 flex w-full justify-end relative z-10">
                <div className="flex gap-2 items-center">
                  <button onClick={handleSkip} className="rounded-full px-3 py-2 text-[15px] font-[500] font-sans -tracking-[0.01em] text-white/50 active:text-white/80 cursor-pointer">
                    Skip All
                  </button>
                  <button onClick={handleNext} className="rounded-full bg-[#ff6e00] px-4 py-[6px] text-[16px] font-[510] font-sans -tracking-[0.01em] text-white active:scale-95 transition-transform cursor-pointer shadow-md">
                    {step === walkthroughSteps.length - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {!isDesktop && step !== 0 && (
          <motion.div 
            animate={{ left: pointerLeft }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute -bottom-5 w-[44px] h-[22px] pointer-events-none drop-shadow-md z-10"
          >
            <img src={imgVector2} alt="pointer" className="absolute inset-0 h-full w-full object-contain" />
          </motion.div>
        )}
      </div>
    </>
  );
}
