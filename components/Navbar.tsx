"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import UserProfileButton from "@/components/UserProfileButton";
import { useUser } from "@stackframe/stack";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b">
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

        {/* Desktop Nav */}
        <nav className="hidden md:flex ml-auto gap-4 sm:gap-6">
          <Link
            href="#mentors"
            className="text-sm font-medium hover:text-red-600 transition-colors"
          >
            Find Mentors
          </Link>
          <Link
            href="#resources"
            className="text-sm font-medium hover:text-red-600 transition-colors"
          >
            Resources
          </Link>
        </nav>

        <div className="hidden md:flex ml-6 gap-2">
          {!user ? (
            <Link href={"/handler/sign-in"}>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          ) : null}

          <UserProfileButton />
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden focus:outline-none"
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

      {/* Mobile Overlay Menu */}
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
              <Link href="#mentors" onClick={() => setIsOpen(false)}>
                Find Mentors
              </Link>
            </li>
            <li>
              <Link href="#resources" onClick={() => setIsOpen(false)}>
                Resources
              </Link>
            </li>
            <li>
              {/* <Link href={"/handler/sign-in"}>Sign up</Link> */}
              {!user ? <Link href={"/handler/sign-in"}>Sign up</Link> : null}
            </li>
            <li>
              <UserProfileButton />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
