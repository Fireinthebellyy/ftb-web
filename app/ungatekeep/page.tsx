import type { Metadata } from "next";
import UngatekeepPageClient from "./UngatekeepPageClient";

export const metadata: Metadata = {
  title: "Ungatekeep — Real Advice for Ambitious Students",
  description:
    "Zero gatekeeping. Cold email scripts, interview breakdowns, college hacks, and AMA drops — everything students usually figure out too late.",
  openGraph: {
    title: "Ungatekeep — Zero Gatekeeping for Indian Students",
    description:
      "Everything you wish someone had told you. College hacks, cold emails, interview prep & more.",
    images: [
      {
        url: "/images/og-ungatekeep.png",
        width: 1200,
        height: 630,
        alt: "Ungatekeep by Fire in the Belly",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ungatekeep — Real Advice for Ambitious Students",
    description:
      "Everything you wish someone had told you. College hacks, cold emails, interview prep & more.",
  },
};

export default function UngatekeepPage() {
  return <UngatekeepPageClient />;
}
