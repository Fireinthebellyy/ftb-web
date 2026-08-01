"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { X } from "lucide-react";

type PopupData = {
  id: string;
  title: string;
  type: "text" | "image";
  content: string | null;
  images: string[];
  delaySeconds: number;
  isActive: boolean;
};

function PopupDialog({ popup }: { popup: PopupData }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, popup.delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [popup]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg p-0 overflow-hidden bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <DialogTitle className="sr-only">{popup.title || "Popup"}</DialogTitle>
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-white/50 p-2 backdrop-blur-sm transition-colors hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <X className="h-4 w-4 text-neutral-800" />
          <span className="sr-only">Close</span>
        </button>

        {popup.type === "text" ? (
          <div className="p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              {popup.title}
            </h2>
            <div className="text-neutral-600 whitespace-pre-wrap">
              {popup.content}
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            {popup.images.length === 1 ? (
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={popup.images[0]}
                  alt={popup.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <Carousel className="w-full">
                <CarouselContent>
                  {popup.images.map((img, idx) => (
                    <CarouselItem key={idx}>
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={img}
                          alt={`${popup.title} - Image ${idx + 1}`}
                          fill
                          className="object-cover"
                          priority={idx === 0}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function GlobalPopup() {
  const pathname = usePathname();

  const { data } = useQuery({
    queryKey: ["global-popups"],
    queryFn: async () => {
      const res = await fetch("/api/popups");
      if (!res.ok) throw new Error("Failed to fetch popups");
      return res.json() as Promise<{ popups: PopupData[] }>;
    },
    // Only fetch once per session or mount
    staleTime: Infinity,
  });

  if (pathname?.startsWith("/admin")) return null;
  if (!data?.popups || data.popups.length === 0) return null;

  return (
    <>
      {data.popups.map((popup) => (
        <PopupDialog key={popup.id} popup={popup} />
      ))}
    </>
  );
}
