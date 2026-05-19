import InternshipList from "@/components/InternshipList";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function InternshipsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?returnUrl=%2Finternships");
  }

  return <InternshipList />;
}
