"use client";

import { motion } from "framer-motion";
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
      className="pb-safe fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-md md:hidden"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex h-12 w-12 items-center justify-center"
              aria-label={item.label}
            >
              <div className="relative">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`rounded-full p-2 transition-colors duration-200 ${
                    isActive
                      ? "text-primary"
                      : "text-neutral-500 group-hover:bg-neutral-100 group-hover:text-neutral-700"
                  }`}
                >
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all duration-200"
                  />
                </motion.div>

                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="bg-primary absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </div>

              <span
                className={`absolute -bottom-6 text-[10px] font-medium transition-all duration-200 ${
                  isActive
                    ? "text-primary translate-y-0 opacity-100"
                    : "translate-2 text-neutral-500 opacity-0 group-hover:opacity-70"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
