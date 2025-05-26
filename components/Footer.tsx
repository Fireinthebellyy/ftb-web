import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex-none flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
      <div className="flex items-center space-x-3">
        <Image
          src="/images/fire-logo.png"
          alt="Fire in the Belly Logo"
          width={24}
          height={24}
          className="object-contain"
        />
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} Fire in the Belly. All rights reserved.
        </p>
      </div>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link
          href="#"
          className="text-xs hover:underline underline-offset-4 text-gray-600"
        >
          Terms of Service
        </Link>
        <Link
          href="/privacy"
          className="text-xs hover:underline underline-offset-4 text-gray-600"
        >
          Privacy Policy
        </Link>
        <Link
          href="#"
          className="text-xs hover:underline underline-offset-4 text-gray-600"
        >
          Contact
        </Link>
        <Link
          href="#"
          className="text-xs hover:underline underline-offset-4 text-gray-600"
        >
          Help
        </Link>
      </nav>
    </footer>
  );
}
