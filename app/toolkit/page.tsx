import type { Metadata } from "next";
import ToolkitPageClient from "./ToolkitPageClient";

export const metadata: Metadata = {
  title: "Toolkits — Career Playbooks That Actually Work",
  description:
    "Step-by-step playbooks for cold emails, interviews, case competitions, and more. Built for ambitious students who want real results.",
  openGraph: {
    title: "Career Toolkits — Fire in the Belly",
    description:
      "Playbooks for cold emails, interviews, and case competitions. Built for India's ambitious students.",
    images: [
      {
        url: "/images/og-toolkit.png",
        width: 1200,
        height: 630,
        alt: "Fire in the Belly Toolkits",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Career Toolkits — Fire in the Belly",
    description:
      "Playbooks for cold emails, interviews, and case competitions. Built for India's ambitious students.",
  },
};

export default function ToolkitPage() {
  return <ToolkitPageClient />;
}
