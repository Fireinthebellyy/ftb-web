"use client";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVersionInfo } from "@/lib/queries";

const Footer = () => {
  const pathname = usePathname();
  const { data: versionInfo } = useVersionInfo();

  if (pathname === "/opportunities" || pathname === "/onboarding") return null;

  return (
    <footer className="border-t border-neutral-200 bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-6 md:flex-row md:justify-between md:space-y-0">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              href="/"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Home
            </Link>
            <Link
              href="/terms"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Privacy
            </Link>
            <Link
              href="/opportunities"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Opportunities
            </Link>
            <Link
              href="/toolkit"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Toolkits
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="https://www.instagram.com/fireinthebelly_ftb/"
              aria-label="Follow us on Instagram"
              target="_blank"
              className="flex items-center justify-center rounded border border-neutral-300 p-2 text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              <Instagram className="h-4 w-4" />
            </Link>
            <Link
              href="https://www.linkedin.com/company/fireinthebelly/"
              aria-label="Follow us on LinkedIn"
              target="_blank"
              className="flex items-center justify-center rounded border border-neutral-300 p-2 text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
            <Link
              href="https://www.youtube.com/@fireinthebelly11"
              aria-label="Follow us on YouTube"
              target="_blank"
              className="flex items-center justify-center rounded border border-neutral-300 p-2 text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              <Youtube className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between text-xs text-neutral-500">
          {versionInfo?.commitSha ? (
            <a
              href={`https://github.com/Fireinthebellyy/ftb-web/commit/${versionInfo.commitSha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-neutral-400 hover:text-neutral-600"
            >
              {versionInfo.commitSha}
            </a>
          ) : (
            <span />
          )}
          <p>
            © {new Date().getFullYear()} Fire in the Belly. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
