import { Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex w-full flex-none shrink-0 flex-col items-center gap-2 border-t bg-white px-4 py-6 sm:flex-row md:px-6">
      <div className="flex flex-wrap items-center justify-center space-x-3">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} Fire in the Belly. All rights reserved.
        </p>
        <div className="flex items-end justify-center gap-3">
          <Link
            href="https://www.instagram.com/fireinthebelly_ftb/"
            aria-label="Follow us on Instagram"
            target="_blank"
          >
            <Instagram className="h-4 w-4" />
          </Link>
          <Link
            href="https://www.linkedin.com/company/fireinthebelly/"
            aria-label="Follow us on LinkedIn"
            target="_blank"
          >
            <Linkedin className="h-4 w-4" />
          </Link>
          <Link
            href="https://www.youtube.com/@fireinthebelly11"
            aria-label="Follow us on YouTube"
            target="_blank"
          >
            <Youtube className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <nav className="flex gap-4 sm:ml-auto sm:gap-6">
        <Link
          href="/terms"
          className="text-xs text-gray-600 underline-offset-4 hover:underline"
        >
          Terms of Service
        </Link>
        <Link
          href="/privacy"
          className="text-xs text-gray-600 underline-offset-4 hover:underline"
        >
          Privacy Policy
        </Link>
        <Link
          href="#"
          className="text-xs text-gray-600 underline-offset-4 hover:underline"
        >
          Contact
        </Link>
        <Link
          href="#"
          className="text-xs text-gray-600 underline-offset-4 hover:underline"
        >
          Help
        </Link>
      </nav>
    </footer>
  );
}
