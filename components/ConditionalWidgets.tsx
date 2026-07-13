"use client";
import { usePathname } from "next/navigation";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { FeedbackWidget } from "@/components/FeedbackWidget";

export default function ConditionalWidgets() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isCohortPage = pathname.startsWith("/toolkit/cohorts/");

  if (isHomepage) return null;

  return (
    <>
      {!isCohortPage && <WhatsAppWidget />}
      <FeedbackWidget />
    </>
  );
}
