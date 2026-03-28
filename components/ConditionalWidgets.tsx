"use client";
import { usePathname } from "next/navigation";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { FeedbackWidget } from "@/components/FeedbackWidget";

export default function ConditionalWidgets() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  if (isHomepage) return null;

  return (
    <>
      <WhatsAppWidget />
      <FeedbackWidget />
    </>
  );
}
