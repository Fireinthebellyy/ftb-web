import InternshipList from "@/components/InternshipList";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fire In The Belly (FTB) - Your College Companion",
  description:
    "Discover Internships, National & International Opportunities, Mentors at every stage of college life. ZERO GATEKEEPING.",
  openGraph: {
    title: "Fire In The Belly (FTB) - Your College Companion",
    description:
      "Discover Internships, National & International Opportunities, Mentors at every stage of college life. ZERO GATEKEEPING.",
    url: "https://www.ftbhustle.com/internships",
    siteName: "Fire in the Belly",
    images: [
      {
        url: "/images/og-home.png",
        width: 1200,
        height: 630,
        alt: "Fire In The Belly (FTB)",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fire In The Belly (FTB) - Your College Companion",
    description:
      "Discover Internships, National & International Opportunities, Mentors at every stage of college life. ZERO GATEKEEPING.",
    images: ["/images/og-home.png"],
    creator: "@ftbhustle",
  },
};


export default async function InternshipsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?returnUrl=%2Finternships");
  }

  return <InternshipList />;
}
