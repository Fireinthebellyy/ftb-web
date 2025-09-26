"use client";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Righteous } from "next/font/google";
import { usePathname } from "next/navigation";

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
});

const Footer = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    if (textRef.current) observer.observe(textRef.current);
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (textRef.current) observer.unobserve(textRef.current);
    };
  }, []);

  if (pathname === "/opportunities") return null;

  return (
    <footer className="bg-orange-600/70 pt-6 pb-4 text-white md:pt-0">
      {pathname === "/" && (
        <div className="container mx-auto px-4 pt-12">
          <div
            className="flex flex-col items-center justify-center md:flex-row"
            style={{ perspective: "1200px" }}
          >
            <div
              ref={textRef}
              className={`transform transition-all duration-2000 ease-out ${
                visible
                  ? "translate-y-0 rotate-x-0 opacity-80"
                  : "translate-y-15 rotate-x-[50deg] opacity-20 md:translate-y-24"
              } ${righteous.className} mb-1 text-4xl font-bold md:mb-0 md:text-7xl md:text-[96px]`}
            >
              Fire In The Belly
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 flex flex-col items-center justify-center space-y-4 md:flex-row md:space-y-0 md:space-x-8">
        <div className="flex space-x-4">
          <Link
            href="/"
            className="relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-500 hover:after:w-full"
          >
            Home
          </Link>
          <Link
            href="/terms"
            className="relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-500 hover:after:w-full"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-500 hover:after:w-full"
          >
            Privacy
          </Link>
          <Link
            href="/"
            className="relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-500 hover:after:w-full"
          >
            About
          </Link>
        </div>
        <div className="flex items-end justify-center gap-3">
          <Link
            href="https://www.instagram.com/fireinthebelly_ftb/"
            aria-label="Follow us on Instagram"
            target="_blank"
          >
            <div className="group flex items-center justify-center rounded border border-neutral-50 p-1 hover:shadow hover:shadow-neutral-200">
              <Instagram className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" />
            </div>
          </Link>
          <Link
            href="https://www.linkedin.com/company/fireinthebelly/"
            aria-label="Follow us on LinkedIn"
            target="_blank"
          >
            <div className="group flex items-center justify-center rounded border border-neutral-50 p-1 hover:shadow hover:shadow-neutral-200">
              <Linkedin className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" />
            </div>
          </Link>
          <Link
            href="https://www.youtube.com/@fireinthebelly11"
            aria-label="Follow us on YouTube"
            target="_blank"
          >
            <div className="group flex items-center justify-center rounded border border-neutral-50 p-1 hover:shadow hover:shadow-neutral-200">
              <Youtube className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" />
            </div>
          </Link>
        </div>
      </div>
      <div className="mt-4 text-center text-xs text-white/80">
        <p>
          © {new Date().getFullYear()} Fire in the Belly. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
