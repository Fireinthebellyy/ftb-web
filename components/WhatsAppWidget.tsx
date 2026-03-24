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
  DrawerTitle,
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

  const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );

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
            <WhatsAppIcon className="h-6 w-6" />
          </button>
        </DrawerTrigger>

        <DrawerContent className="md:hidden">
          <DrawerTitle className="sr-only">How can we help?</DrawerTitle>
          <div className="px-4 py-5">
            <p className="text-lg font-semibold">How can we help?</p>
            <div className="mt-3 space-y-3">
              {options.map((type) => {
                const link = `https://wa.me/917014885565?text=${encodeURIComponent(
                  `Type: ${type}\nSource: ${source}\n\nPlease describe your feedback:`
                )}`;
                return ( <a
                  
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
            <WhatsAppIcon className="h-7 w-7" />
          </button>
        </DialogTrigger>

        <DialogContent className="hidden w-80 md:block p-6 pt-8">
          <DialogTitle>How can we help?</DialogTitle>
          <div className="mt-3 space-y-3">
            {options.map((type) => {
              const link = `https://wa.me/917014885565?text=${encodeURIComponent(
                `Type: ${type}\nSource: ${source}\n\nPlease describe your feedback:`
              )}`;
              return ( <a
                
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