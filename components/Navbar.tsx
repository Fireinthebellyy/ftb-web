"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function circleSkeleton(className = "size-8") {
  return (
    <div
      className={`rounded-full bg-muted animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

// Idempotent logout with guard against duplicate clicks
function useLogout() {
  const router = useRouter();
  const inFlight = useRef(false);

  const signOut = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await authClient.signOut();
    } catch {
      // ignore errors; we still route home
    } finally {
      router.push("/");
      inFlight.current = false;
    }
  }, [router]);

  return signOut;
}

export default function Navbar() {
  // Mobile menu (existing)
  const [isOpen, setIsOpen] = useState(false);

  // Auth session hook supports pending state
  const { data: user, isPending } = authClient.useSession();

  // Avatar dropdown state
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);
  const lastItemRef = useRef<HTMLButtonElement | null>(null);
  const menuId = "nav-avatar-menu";

  const handleLogout = useLogout();

  // Global Escape handling for mobile overlay
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  // Manage keyboard navigation within the menu
  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setMenuOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      (document.activeElement === lastItemRef.current
        ? firstItemRef.current
        : (document.activeElement
            ?.nextElementSibling as HTMLButtonElement | null) ??
          firstItemRef.current
      )?.focus();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      (document.activeElement === firstItemRef.current
        ? lastItemRef.current
        : (document.activeElement
            ?.previousElementSibling as HTMLButtonElement | null) ??
          lastItemRef.current
      )?.focus();
      return;
    }
    if (e.key === "Tab") {
      // trap focus within menu
      if (e.shiftKey && document.activeElement === firstItemRef.current) {
        e.preventDefault();
        lastItemRef.current?.focus();
      } else if (
        !e.shiftKey &&
        document.activeElement === lastItemRef.current
      ) {
        e.preventDefault();
        firstItemRef.current?.focus();
      }
    }
  };

  // When opening menu, move focus to first item
  useEffect(() => {
    if (menuOpen) {
      const id = requestAnimationFrame(() => firstItemRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [menuOpen]);

  // Derive avatar visual
  const avatarFallback = useMemo(() => {
    const name = user?.user?.name || user?.user?.email || "";
    const letters = name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return letters || "U";
  }, [user]);

  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b flex-none">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/images/fire-logo.png"
            alt="Fire in the Belly Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-bold text-xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent hidden sm:inline">
            Fire in the Belly
          </span>
          <span className="font-bold text-xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent sm:hidden">
            FTB
          </span>
        </Link>

        {/* Center/left navigation unchanged */}
        <nav className="hidden md:flex ml-auto gap-4 sm:gap-6">
          <Link
            href="/opportunities"
            className="text-sm font-medium hover:text-red-600 transition-colors"
          >
            Opportunities
          </Link>
        </nav>

        {/* Right side: avatar-only area with guest Login when unauthenticated */}
        <div className="ml-4 flex items-center">
          {/* Pending skeleton: render minimal circle and nothing else */}
          {isPending ? (
            circleSkeleton()
          ) : user ? (
            <div className="relative">
              <button
                ref={triggerRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                className="focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full"
                onClick={() => setMenuOpen((v) => !v)}
                onKeyDown={(e) => {
                  if (
                    (e.key === "ArrowDown" ||
                      e.key === "Enter" ||
                      e.key === " ") &&
                    !menuOpen
                  ) {
                    e.preventDefault();
                    setMenuOpen(true);
                  }
                }}
              >
                <Avatar>
                  <AvatarImage
                    src={(user.user as any)?.image || undefined}
                    alt={user.user.name || "User avatar"}
                  />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  id={menuId}
                  role="menu"
                  aria-labelledby={undefined}
                  tabIndex={-1}
                  className="absolute right-0 mt-2 w-40 rounded-md border bg-popover text-popover-foreground shadow-md p-1"
                  onKeyDown={onMenuKeyDown}
                >
                  <button
                    ref={firstItemRef}
                    role="menuitem"
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent focus:bg-accent focus:outline-none"
                    onClick={() => {
                      setMenuOpen(false);
                      // use client-side navigation to profile
                      window.location.href = "/profile";
                    }}
                  >
                    Profile
                  </button>
                  <button
                    ref={lastItemRef}
                    role="menuitem"
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent focus:bg-accent text-red-600 focus:outline-none"
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Not authenticated: show Login button
            <Link
              href="/login"
              className="text-sm font-medium hover:text-red-600 transition-colors"
            >
              Log in
            </Link>
          )}

          {/* Mobile hamburger kept for existing site structure */}
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden focus:outline-none ml-3"
            aria-label="Open menu"
            aria-haspopup="true"
            aria-expanded={isOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Overlay Menu - unchanged items except auth-driven ones are hidden by avatar-only requirement on desktop; keep for mobile pages */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-95 md:hidden min-h-dvh"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 focus:outline-none"
            aria-label="Close menu"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <ul className="flex flex-col items-center space-y-8 text-2xl font-semibold text-red-700">
            <li>
              <Link href="/" onClick={() => setIsOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/opportunities" onClick={() => setIsOpen(false)}>
                Opportunities
              </Link>
            </li>
            {/* If authenticated, show Profile link inside mobile overlay for navigation */}
            {!isPending && user ? (
              <li>
                <Link href="/profile" onClick={() => setIsOpen(false)}>
                  Profile
                </Link>
              </li>
            ) : null}
            {/* Logout inside overlay if authenticated */}
            {!isPending && user ? (
              <li>
                <button
                  className="text-red-600"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  Log out
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </header>
  );
}
