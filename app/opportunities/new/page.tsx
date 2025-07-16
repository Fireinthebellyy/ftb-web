import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ClientNewOpportunityForm from "./ClientNewOpportunityForm";

export default async function NewOpportunityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  return <ClientNewOpportunityForm />;
}
