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
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-200 bg-white backdrop-blur-md md:hidden"
    >
      <div className="flex h-[52px] items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-full w-16 flex-col items-center justify-center"
              aria-label={item.label}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${isActive
                    ? "bg-primary/10"
                    : "text-neutral-700 group-hover:bg-neutral-100 group-hover:text-neutral-600"
                  }`}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={`transition-all duration-200 ${isActive ? "text-primary" : ""
                    }`}
                />
              </motion.div>

              <span
                className={`text-[10px] font-medium transition-all duration-200 ${isActive
                    ? "text-primary"
                    : "text-neutral-400 group-hover:text-neutral-600"
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
