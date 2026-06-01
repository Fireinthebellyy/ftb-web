import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import QueryProvider from "@/components/Providers";
import AuthOverlay from "@/components/auth/AuthOverlay";
import ProgressProvider from "./providers";
import Script from "next/script";
import ConditionalWidgets from "@/components/ConditionalWidgets";
import PostOnboardingSurveyWidget from "@/components/PostOnboardingSurveyWidget";
import InterestPromptGate from "@/components/InterestPromptGate";
import { TrackerProvider } from "@/components/providers/TrackerProvider";
import { CSPostHogProvider } from "./providers/posthog-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["400", "700"], // or ["400", "700"] if multiple
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

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
      <head>
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${plusJakartaSans.className} flex min-h-screen flex-col bg-neutral-50 font-sans antialiased`}
        suppressHydrationWarning
      >
        <Suspense fallback={<div>Loading ..</div>}>
          <QueryProvider>
            <ProgressProvider>
              <CSPostHogProvider>
                <TrackerProvider>
                  <Navbar />
                  <main className="grow pt-16 pb-20 md:pb-0">{children}</main>
                  <AuthOverlay />
                  <BottomNav />
                  <Footer />
                  <ConditionalWidgets />
                  <PostOnboardingSurveyWidget />
                  <InterestPromptGate />
                </TrackerProvider>
              </CSPostHogProvider>
            </ProgressProvider>
            <Toaster />
            <Analytics />
          </QueryProvider>
        </Suspense>
      </body>
    </html>
  );
}
