import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  Autoplay,
} from "@/components/ui/carousel";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";

interface OpportunityImageGalleryProps {
  images: string[];
  title: string;
  onOpenModal: (index: number) => void;
}

export function OpportunityImageGallery({
  images,
  title,
  onOpenModal,
}: OpportunityImageGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <>
      {images.length === 1 ? (
        <div className="overflow-hidden">
          <div
            className="cursor-pointer"
            onClick={() => onOpenModal(0)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onOpenModal(0);
              }
            }}
          >
            {images[0] ? (
              <Image
                src={tryGetStoragePublicUrl("opportunity-images", images[0])}
                alt={title}
                className="max-h-48 w-full rounded-t-lg object-cover object-left-top sm:max-h-64"
                loading="lazy"
                height={256}
                width={400}
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-neutral-100 text-sm text-gray-400">
                Image not available
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <Carousel
            className="w-full"
            plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}
          >
            <CarouselContent>
              {images.map((image, i) => (
                <CarouselItem key={i}>
                  <div
                    className="cursor-pointer overflow-hidden"
                    onClick={() => onOpenModal(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onOpenModal(i);
                      }
                    }}
                  >
                    {image ? (
                      <Image
                        src={tryGetStoragePublicUrl(
                          "opportunity-images",
                          image
                        )}
                        alt={`${title} - Image ${i + 1}`}
                        className="max-h-48 w-full rounded-t-lg object-cover object-left-top sm:max-h-64"
                        loading="lazy"
                        height={256}
                        width={400}
                      />
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-neutral-100 text-sm text-gray-400">
                        Image not available
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselDots />
          </Carousel>
        </div>
      )}
    </>
  );
}
