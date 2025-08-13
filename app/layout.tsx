import type React from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans min-h-screen flex flex-col`}
      >
        <Suspense fallback={<div>Loading ..</div>}>
          <Navbar />
          <main className="grow">
            <Providers>{children}</Providers>
          </main>
          <Footer />
          <Toaster />
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
