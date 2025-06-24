import { stackServerApp } from "@/stack";
import ClientNewOpportunityForm from "./ClientNewOpportunityForm";

export default async function NewOpportunityPage() {
  await stackServerApp.getUser({ or: "redirect" });
  return <ClientNewOpportunityForm />;
}
