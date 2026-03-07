"use client";

import React, { useState, useEffect } from "react";
import { createOpportunityStorage } from "@/lib/appwrite";
import { OpportunityPostProps } from "@/types/interfaces";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTracker } from "@/components/providers/TrackerProvider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import Image from "next/image";
import { OpportunityHeader } from "./opportunity/OpportunityHeader";
import { OpportunityImageGallery } from "./opportunity/OpportunityImageGallery";
import { OpportunityActions } from "./opportunity/OpportunityActions";
import NewOpportunityForm from "./opportunity/NewOpportunityForm";

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const OpportunityPost: React.FC<OpportunityPostProps> = ({
  opportunity,
  onBookmarkChange,
}) => {
  const { id, images, title } = opportunity;

  const { items, addToTracker, removeFromTracker } = useTracker();
  const trackedItem = items.find(
    (i) => i.kind === "opportunity" && String(i.oppId) === String(id)
  );
  const isBookmarked = Boolean(trackedItem);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalIndex, setModalIndex] = useState<number>(0);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const handleEditSuccess = () => {
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  };

  const handleBookmarkChange = async (_id: string, newState: boolean) => {
    if (!session?.user?.id) {
      toast.error("Please log in to bookmark opportunities");
      return;
    }

    if (!isValidUUID(id)) {
      console.error("Invalid opportunity ID format");
      return;
    }

    try {
      if (newState) {
        addToTracker(
          {
            id,
            opportunityId: id,
            title: opportunity.title,
            company:
              (opportunity as any).hiringOrganization ||
              opportunity.organiserInfo ||
              "Unknown Organization",
            logo: opportunity.images?.[0]
              ? createOpportunityStorage()
                  .getFileView(
                    process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID ||
                      "",
                    opportunity.images[0]
                  )
                  .toString()
              : undefined,
            type: opportunity.type,
            location: opportunity.location,
            deadline: opportunity.endDate,
            kind: "opportunity",
          } as any,
          "Not Applied",
          "opportunity"
        );
      } else {
        if (trackedItem) {
          removeFromTracker(
            trackedItem.oppId as string | number,
            trackedItem.kind ?? "opportunity"
          );
        }
      }

      if (onBookmarkChange) {
        onBookmarkChange(id, newState);
      }
    } catch (err) {
      console.error("Bookmark request failed:", err);
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <article className="relative mb-3 w-full rounded-lg border bg-white shadow-sm sm:mb-4">
      <OpportunityImageGallery
        images={images}
        title={title}
        onOpenModal={(index) => {
          setModalIndex(index);
          setModalOpen(true);
        }}
      />

      <OpportunityHeader opportunity={opportunity} />

      <Dialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
        <DialogContent
          className="mx-auto min-w-auto p-0 md:min-w-3xl"
          overlayClassName="bg-black/70"
        >
          <ImageModal
            images={images}
            title={title}
            modalIndex={modalIndex}
            modalFileId={images[modalIndex] ?? images[0] ?? null}
          />
        </DialogContent>
      </Dialog>

      <div className="px-3 py-2 sm:px-4">
        <OpportunityActions
          opportunity={opportunity}
          isBookmarked={isBookmarked}
          onBookmarkChange={handleBookmarkChange}
          showComments={showComments}
          setShowComments={setShowComments}
          onEdit={() => setIsEditing(true)}
        />

        <Dialog open={isEditing} onOpenChange={(open) => setIsEditing(open)}>
          <DialogContent
            className="mx-auto p-4 md:max-h-[600px] md:min-w-[600px]"
            overlayClassName="backdrop-blur-xs bg-black/30"
          >
            <NewOpportunityForm
              opportunity={opportunity}
              onOpportunityCreated={handleEditSuccess}
              onCancel={() => setIsEditing(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </article>
  );
};

interface ImageModalProps {
  images: string[];
  title: string;
  modalIndex: number;
  modalFileId: string | null;
}

function ImageModal({
  images,
  title,
  modalIndex,
  modalFileId,
}: ImageModalProps) {
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const opportunityStorage = createOpportunityStorage();

  useEffect(() => {
    if (carouselApi) {
      setTimeout(() => carouselApi.scrollTo(modalIndex), 0);
    }
  }, [modalIndex, carouselApi]);

  if (images.length <= 1) {
    return (
      <div className="flex items-center justify-center">
        {modalFileId ? (
          <ImageModalContent
            opportunityStorage={opportunityStorage}
            fileId={modalFileId}
            title={title}
          />
        ) : (
          <div className="w-full text-center text-sm text-gray-400">
            Image not available
          </div>
        )}
      </div>
    );
  }

  return (
    <Carousel className="w-full" setApi={setCarouselApi}>
      <CarouselContent>
        {images.map((image, idx) => (
          <CarouselItem key={idx}>
            <div className="flex h-full items-center justify-center bg-transparent">
              {image ? (
                <ImageModalContent
                  opportunityStorage={opportunityStorage}
                  fileId={image}
                  title={`${title} - Image ${idx + 1}`}
                />
              ) : (
                <div className="w-full text-center text-sm text-gray-400">
                  Image not available
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselDots />
    </Carousel>
  );
}

interface ImageModalContentProps {
  opportunityStorage: ReturnType<typeof createOpportunityStorage>;
  fileId: string;
  title: string;
}

function ImageModalContent({
  opportunityStorage,
  fileId,
  title,
}: ImageModalContentProps) {
  return (
    <Image
      src={opportunityStorage.getFileView(
        process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
        fileId
      )}
      alt={title}
      className="max-h-[80vh] w-full object-contain"
      height={600}
      width={800}
    />
  );
}

export default OpportunityPost;
