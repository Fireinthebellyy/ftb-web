"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, CalendarClock, Flame, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/internships", label: "Internships", icon: Flame },
  { href: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/onboarding") {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-200 bg-white backdrop-blur-md md:hidden"
    >
      <div className="flex h-[56px] items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex h-full w-16 flex-col items-center justify-center gap-0.5"
              aria-label={item.label}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-200 ${
                  isActive
                    ? "bg-primary/10"
                    : "text-neutral-700 group-hover:bg-neutral-100 group-hover:text-neutral-600"
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={2.5}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-primary" : ""
                  }`}
                />
              </motion.div>

              <motion.span
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  y: isActive ? 0 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={`text-[9px] font-bold transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-neutral-400"
                }`}
              >
                {item.label}
              </motion.span>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-primary absolute -bottom-2.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full"
                  />
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
