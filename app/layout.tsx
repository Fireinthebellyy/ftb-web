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
import ThemeProvider from "@/components/ThemeProvider";
import GlobalPopup from "@/components/GlobalPopup";

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
  metadataBase: new URL("https://www.ftbhustle.com"),
  title: {
    default: "Fire in the Belly — Ignite Your Learning Journey",
    template: "%s | Fire in the Belly",
  },
  description:
    "Connect with mentors, discover verified internships, fellowships, and resources. Accelerate your career with personalized guidance for India's ambitious students.",
  keywords: [
    "internships india",
    "student opportunities",
    "career guidance",
    "fellowships",
    "hackathons",
    "case competitions",
    "career toolkit",
    "ungatekeep",
    "fire in the belly",
    "ftb",
  ],
  authors: [{ name: "Fire in the Belly", url: "https://www.ftbhustle.com" }],
  creator: "Fire in the Belly",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.ftbhustle.com",
    siteName: "Fire in the Belly",
    title: "Fire in the Belly — Ignite Your Learning Journey",
    description:
      "Discover internships, opportunities, and career toolkits for ambitious Indian students. Zero gatekeeping.",
    images: [
      {
        url: "/images/og-home.png",
        width: 1200,
        height: 630,
        alt: "Fire in the Belly",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fire in the Belly — Ignite Your Learning Journey",
    description:
      "Discover internships, opportunities, and career toolkits for ambitious Indian students.",
    images: ["/images/og-home.png"],
    creator: "@ftbhustle",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
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
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
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
                    <GlobalPopup />
                  </TrackerProvider>
                </CSPostHogProvider>
              </ProgressProvider>
              <Toaster />
              <Analytics />
            </ThemeProvider>
          </QueryProvider>
        </Suspense>
      </body>
    </html>
  );
}
