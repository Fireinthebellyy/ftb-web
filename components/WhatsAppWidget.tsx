"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const TOOLKIT_DETAIL_BOTTOM_MOBILE_CLASS = "bottom-[170px]";
const DEFAULT_BOTTOM_MOBILE_CLASS = "bottom-[72px]";
const TOOLKIT_DETAIL_BOTTOM_DESKTOP_CLASS = "bottom-[170px]";
const DEFAULT_BOTTOM_DESKTOP_CLASS = "bottom-6";

export default function WhatsAppWidget() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isExcludedPage =
    pathname.startsWith("/intern") || pathname.startsWith("/opportunities");

  if (isExcludedPage) return null;

  const isToolkitDetailPage =
    pathname.startsWith("/toolkit/") && pathname !== "/toolkit";

  const mobileBottomClass = isToolkitDetailPage
    ? TOOLKIT_DETAIL_BOTTOM_MOBILE_CLASS
    : DEFAULT_BOTTOM_MOBILE_CLASS;

  const desktopBottomClass = isToolkitDetailPage
    ? TOOLKIT_DETAIL_BOTTOM_DESKTOP_CLASS
    : DEFAULT_BOTTOM_DESKTOP_CLASS;

  const source = pathname;

  const options = [
    "Appreciate the team/product",
    "Report a problem",
    "Request for mentorship/guide",
    "Share an idea",
    "Other inquiries",
  ];

  return (
    <>
    
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerTrigger asChild>
          <button
            className={cn(
              "fixed right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 shadow-lg hover:bg-neutral-100 md:hidden",
              mobileBottomClass
            )}
            aria-label="Chat on WhatsApp"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="h-6 w-6"
              fill="currentColor"
            >
              <path d="M16.04 2.003c-7.72 0-13.997 6.277-13.997 13.997 0 2.47.648 4.885 1.877 7.01L2 30l7.16-1.88a13.93 13.93 0 0 0 6.88 1.83h.01c7.72 0 13.997-6.277 13.997-13.997S23.76 2.003 16.04 2.003zm0 25.49c-2.15 0-4.25-.58-6.08-1.67l-.44-.26-4.25 1.12 1.13-4.14-.29-.43a11.47 11.47 0 0 1-1.77-6.12c0-6.36 5.18-11.54 11.54-11.54 3.08 0 5.98 1.2 8.16 3.38a11.48 11.48 0 0 1 3.38 8.16c0 6.36-5.18 11.54-11.54 11.54z" />
            </svg>
          </button>
        </DrawerTrigger>

        <DrawerContent className="md:hidden">
          <div className="px-4 py-5">
            {/* Title */}
            <p className="text-lg font-semibold">How can we help?</p>

            {/* Options */}
            <div className="mt-3 space-y-3">
              {options.map((type) => {
                const link = `https://wa.me/917014885565?text=${encodeURIComponent(
                  `Type: ${type}\nSource: ${source}\n\nPlease describe your feedback:`
                )}`;

                return (
                  <a
                    key={type}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg bg-neutral-100 px-4 py-3 text-sm hover:bg-neutral-200 transition"
                  >
                    {type}
                  </a>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={desktopOpen} onOpenChange={setDesktopOpen}>
        <DialogTrigger asChild>
          <button
            className={cn(
              "fixed right-6 z-50 hidden h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 shadow-lg hover:bg-neutral-100 md:flex",
              desktopBottomClass
            )}
            aria-label="Chat on WhatsApp"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="h-7 w-7"
              fill="currentColor"
            >
              <path d="M16.04 2.003c-7.72 0-13.997 6.277-13.997 13.997 0 2.47.648 4.885 1.877 7.01L2 30l7.16-1.88a13.93 13.93 0 0 0 6.88 1.83h.01c7.72 0 13.997-6.277 13.997-13.997S23.76 2.003 16.04 2.003zm0 25.49c-2.15 0-4.25-.58-6.08-1.67l-.44-.26-4.25 1.12 1.13-4.14-.29-.43a11.47 11.47 0 0 1-1.77-6.12c0-6.36 5.18-11.54 11.54-11.54 3.08 0 5.98 1.2 8.16 3.38a11.48 11.48 0 0 1 3.38 8.16c0 6.36-5.18 11.54-11.54 11.54z" />
            </svg>
          </button>
        </DialogTrigger>

        <DialogContent className="hidden w-80 md:block p-6 pt-8">
          <DialogTitle>How can we help?</DialogTitle>

          <div className="mt-3 space-y-3">
            {options.map((type) => {
              const link = `https://wa.me/917014885565?text=${encodeURIComponent(
                `Type: ${type}\nSource: ${source}\n\nPlease describe your feedback:`
              )}`;

              return (
                <a
                  key={type}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg bg-neutral-100 px-4 py-3 text-sm hover:bg-neutral-200 transition"
                >
                  {type}
                </a>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}