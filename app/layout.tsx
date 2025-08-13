import type React from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/components/Providers";

const poppins = Poppins({
  weight: "400",
  variable: "--font-poppins",
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
        className={`${poppins.className} antialiased font-sans min-h-screen flex flex-col`}
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
