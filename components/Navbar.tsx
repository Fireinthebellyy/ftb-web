"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Righteous } from "next/font/google";
import { EllipsisVertical } from "lucide-react";

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

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
});

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const { data: user, isPending } = authClient.useSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);
  const lastItemRef = useRef<HTMLButtonElement | null>(null);
  const menuId = "nav-avatar-menu";

  const handleLogout = useLogout();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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
        : ((document.activeElement
            ?.nextElementSibling as HTMLButtonElement | null) ??
          firstItemRef.current)
      )?.focus();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      (document.activeElement === firstItemRef.current
        ? lastItemRef.current
        : ((document.activeElement
            ?.previousElementSibling as HTMLButtonElement | null) ??
          lastItemRef.current)
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

  useEffect(() => {
    if (menuOpen) {
      const id = requestAnimationFrame(() => firstItemRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [menuOpen]);

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
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 flex-none bg-gray-50 backdrop-blur-sm"
    >
      <div className="container mx-auto grid h-16 grid-cols-2 items-center px-4 md:grid-cols-3 lg:px-6">
        <div className="flex items-center justify-start space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/fire-logo.png"
              alt="Fire in the Belly Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span
              className={`${righteous.className} hidden bg-clip-text text-xl font-bold tracking-tight text-neutral-800 sm:inline`}
            >
              Fire in the Belly
            </span>
          </Link>
        </div>

        <nav className="hidden justify-center gap-4 sm:gap-6 md:flex">
          <Link
            href="/opportunities"
            className={`relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:bg-current after:transition-all after:duration-500 hover:text-neutral-500 hover:after:w-full ${
              pathname === "/opportunities"
                ? "text-primary after:w-full"
                : "text-neutral-800 after:w-0"
            }`}
          >
            Opportunities
          </Link>

          <Link
            href="/featured"
            className={`relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:bg-current after:transition-all after:duration-500 hover:text-neutral-500 hover:after:w-full ${
              pathname === "/featured"
                ? "text-primary after:w-full"
                : "text-neutral-800 after:w-0"
            }`}
          >
            Featured
          </Link>
          <Link
            href="/deadlines"
            className={`relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:bg-current after:transition-all after:duration-500 hover:text-neutral-500 hover:after:w-full ${
              pathname === "/deadlines"
                ? "text-primary after:w-full"
                : "text-neutral-800 after:w-0"
            }`}
          >
            Deadlines
          </Link>
        </nav>

        {/* Right side: auth controls and Get Started button */}
        <div className="flex items-center justify-end space-x-1 md:space-x-4">
          {isPending ? (
            <div role="status">
              <svg
                aria-hidden="true"
                className="me-2 h-4 w-4 animate-spin fill-orange-600 text-gray-200 dark:text-gray-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          ) : user ? (
            <div className="flex items-center justify-center space-x-2">
              <span className="hidden text-sm font-medium sm:inline">
                Hi, {user?.user?.name?.split(" ")[0] || "User"}!
              </span>
              <div className="relative flex items-center">
                {user.user?.image ? (
                  <div className="rounded-full border-2 border-white shadow-lg">
                    <Image
                      src={user.user.image}
                      alt={user.user.name || "User avatar"}
                      className="size-6 rounded-full object-cover"
                      width={24}
                      height={24}
                    />
                  </div>
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-200 text-xs font-semibold text-neutral-600 uppercase">
                    {avatarFallback}
                  </div>
                )}
                <button
                  ref={triggerRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-controls={menuId}
                  className="hidden cursor-pointer rounded-full focus:ring-2 focus:ring-neutral-500 focus:outline-none md:block"
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
                  <EllipsisVertical className="ml-1 size-4 text-neutral-600" />
                </button>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    id={menuId}
                    role="menu"
                    aria-labelledby={undefined}
                    tabIndex={-1}
                    className="bg-popover text-popover-foreground absolute top-8 right-0 z-50 w-40 rounded-md border p-1 shadow-md"
                    onKeyDown={onMenuKeyDown}
                  >
                    <button
                      ref={firstItemRef}
                      role="menuitem"
                      className="hover:bg-accent focus:bg-accent w-full rounded px-3 py-2 text-left text-sm focus:outline-none"
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
                      className="hover:bg-accent focus:bg-accent w-full rounded px-3 py-2 text-left text-sm text-red-600 focus:outline-none"
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
            </div>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" variant="primary">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger kept for existing site structure */}
          <button
            onClick={() => setIsOpen(true)}
            className="ml-1 focus:outline-none md:hidden"
            aria-label="Open menu"
            aria-haspopup="true"
            aria-expanded={isOpen}
          >
            <svg
              className="h-6 w-6"
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
          className="bg-opacity-95 fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-white md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 focus:outline-none"
            aria-label="Close menu"
          >
            <svg
              className="h-8 w-8"
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
          <ul className="flex flex-col items-center space-y-8 text-2xl font-semibold text-gray-700">
            <li>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className={`relative transition-colors duration-200 after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:bg-current after:transition-all after:duration-500 ${
                  pathname === "/"
                    ? "text-primary font-bold after:w-full"
                    : "hover:text-primary text-gray-700 after:w-0 hover:after:w-full"
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/opportunities"
                onClick={() => setIsOpen(false)}
                className={`relative transition-colors duration-200 after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:bg-current after:transition-all after:duration-500 ${
                  pathname === "/opportunities"
                    ? "text-primary font-bold after:w-full"
                    : "hover:text-primary text-gray-700 after:w-0 hover:after:w-full"
                }`}
              >
                Opportunities
              </Link>
            </li>
            <li>
              <Link
                href="/featured"
                onClick={() => setIsOpen(false)}
                className={`relative transition-colors duration-200 after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:bg-current after:transition-all after:duration-500 ${
                  pathname === "/featured"
                    ? "text-primary font-bold after:w-full"
                    : "hover:text-primary text-gray-700 after:w-0 hover:after:w-full"
                }`}
              >
                Featured
              </Link>
            </li>
            <li>
              <Link
                href="/deadlines"
                onClick={() => setIsOpen(false)}
                className={`relative transition-colors duration-200 after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:bg-current after:transition-all after:duration-500 ${
                  pathname === "/featured"
                    ? "text-primary font-bold after:w-full"
                    : "hover:text-primary text-gray-700 after:w-0 hover:after:w-full"
                }`}
              >
                Deadlines
              </Link>
            </li>
            {/* If authenticated, show Profile link inside mobile overlay for navigation */}
            {!isPending && user ? (
              <li>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className={`relative transition-colors duration-200 after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:bg-current after:transition-all after:duration-500 ${
                    pathname === "/profile"
                      ? "text-primary font-bold after:w-full"
                      : "hover:text-primary text-gray-700 after:w-0 hover:after:w-full"
                  }`}
                >
                  Profile
                </Link>
              </li>
            ) : null}
            {/* Logout inside overlay if authenticated */}
            {!isPending && user ? (
              <li>
                <button
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
    </motion.header>
  );
}
