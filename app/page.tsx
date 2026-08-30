import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Fire in the Belly — Internships, Opportunities & Career Toolkits for Students",
  description:
    "India's #1 platform for ambitious students. Discover verified internships, fellowships, hackathons, and career toolkits. Trusted by students from DU, IIMs, SRCC, Manipal & more.",
  openGraph: {
    title: "Fire in the Belly — Everything You Need to Get Ahead",
    description:
      "Discover internships, career toolkits, and opportunities in one place. Zero gatekeeping. Built for India's ambitious 20s.",
    url: "https://www.ftbhustle.com",
    siteName: "Fire in the Belly",
    images: [
      {
        url: "https://www.ftbhustle.com/images/og-home.png",
        width: 1200,
        height: 630,
        alt: "Fire in the Belly",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fire in the Belly — Internships, Opportunities & Toolkits",
    description:
      "India's career platform for ambitious students. Internships, fellowships, toolkits & more.",
    images: ["https://www.ftbhustle.com/images/og-home.png"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
