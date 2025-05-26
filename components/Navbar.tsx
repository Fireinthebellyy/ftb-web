import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="flex-none px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center space-x-3">
        <Image
          src="/images/fire-logo.png"
          alt="Fire in the Belly Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <span className="font-bold text-xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Fire in the Belly
        </span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
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
        <Link
          href="#features"
          className="text-sm font-medium hover:text-red-600 transition-colors"
        >
          Features
        </Link>
        <Link
          href="#about"
          className="text-sm font-medium hover:text-red-600 transition-colors"
        >
          About
        </Link>
      </nav>
      <div className="ml-6 flex gap-2">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
        >
          Get Started
        </Button>
      </div>
    </header>
  );
}
