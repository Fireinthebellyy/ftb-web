"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";

export function AttachmentSlide({
  imageId,
  postTitle,
  idx,
  onClick,
}: {
  imageId: string;
  postTitle: string;
  idx?: number;
  onClick?: () => void;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <span className="text-xs">Failed to load image</span>
      </div>
    );
  }

  const isPdf = imageId.toLowerCase().endsWith(".pdf");
  const displayUrl = tryGetStoragePublicUrl("ungatekeep-images", imageId);

  if (isPdf) {
    const fullUrl = displayUrl;
    // Use a viewer or simple iframe
    const pdfSrc = `${fullUrl}#toolbar=0&navpanes=0&scrollbar=0`;
    const fileName = imageId.split("/").pop() || "Document";

    return (
      <div className="relative h-full w-full group overflow-hidden bg-white">
        {/* PDF content with interaction enabled for scrolling */}
        <iframe
          src={pdfSrc}
          className="h-full w-full border-none"
          title={fileName}
        />

        {/* Small "Open Full" button that doesn't block scrolling */}
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-primary shadow-md hover:bg-white transition-colors border sm:h-8 sm:w-8"
          title="Open full document"
        >
          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </a>
      </div>
    );
  }

  return (
    <button 
      type="button"
      className="group relative h-full w-full cursor-pointer overflow-hidden rounded-lg"
      onClick={onClick}
      aria-label="Open image viewer"
    >
      <Image
        src={displayUrl}
        alt={idx !== undefined ? `${postTitle} - Item ${idx + 1}` : postTitle}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        unoptimized={true}
        onError={() => setError(true)}
      />
    </button>
  );
}

export function ImageModal({
  attachments,
  postTitle,
  modalIndex,
}: {
  attachments: string[];
  postTitle: string;
  modalIndex: number;
}) {
  const [carouselApi, setCarouselApi] = useState<any>(null);

  useEffect(() => {
    if (carouselApi) {
      setTimeout(() => carouselApi.scrollTo(modalIndex), 0);
    }
  }, [modalIndex, carouselApi]);

  const images = attachments.filter(id => !id.toLowerCase().endsWith(".pdf"));

  if (images.length <= 1) {
    const fileId = images[0] || attachments[modalIndex];
    return (
      <div className="flex items-center justify-center p-0">
        <Image
          src={tryGetStoragePublicUrl("ungatekeep-images", fileId)}
          alt={postTitle}
          className="max-h-[85vh] w-full object-contain"
          height={1200}
          width={1200}
          unoptimized={true}
        />
      </div>
    );
  }

  return (
    <Carousel className="w-full" setApi={setCarouselApi}>
      <CarouselContent>
        {images.map((fileId, idx) => (
          <CarouselItem key={idx}>
            <div className="flex h-full items-center justify-center bg-transparent">
              <Image
                src={tryGetStoragePublicUrl("ungatekeep-images", fileId)}
                alt={`${postTitle} - Image ${idx + 1}`}
                className="max-h-[85vh] w-full object-contain"
                height={1200}
                width={1200}
                unoptimized={true}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselDots className="mt-4" />
    </Carousel>
  );
}
