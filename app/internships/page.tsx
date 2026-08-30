import InternshipList from "@/components/InternshipList";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internships — Apply Smarter with Fire in the Belly",
  description:
    "Discover curated internships across India. Track deadlines, save favourites, and apply smarter. Part-time, full-time, and remote roles available.",
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
