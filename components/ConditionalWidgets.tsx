"use client";
import { usePathname } from "next/navigation";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { FeedbackWidget } from "@/components/FeedbackWidget";

export default function ConditionalWidgets() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isToolkitPage = pathname?.startsWith("/toolkit") || false;

  if (isHomepage) return null;

  return (
    <>
      {!isToolkitPage && <WhatsAppWidget />}
      <FeedbackWidget />
    </>
  );
}
