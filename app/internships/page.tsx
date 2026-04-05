import { Suspense } from "react";
import InternshipList from "@/components/InternshipList";

export default function InternshipsPage() {
  return (
    <Suspense fallback={null}>
      <InternshipList />
    </Suspense>
  );
}
