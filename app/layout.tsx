import type React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import QueryProvider from "@/components/Providers";
import ProgressProvider from "./providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["400", "700"], // or ["400", "700"] if multiple
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fire in the Belly - Ignite Your Learning Journey",
  description:
    "Connect with certified mentors, discover trending resources, and accelerate your growth with personalized guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${plusJakartaSans.className} flex min-h-screen flex-col bg-neutral-50 font-sans antialiased`}
        suppressHydrationWarning
      >
        <Suspense fallback={<div>Loading ..</div>}>
          <ProgressProvider>
            <Navbar />
            <main className="grow pb-20 md:pb-0">
              <QueryProvider>{children}</QueryProvider>
            </main>
            <BottomNav />
          </ProgressProvider>
          <Footer />
          <Toaster />
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
