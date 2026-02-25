"use client";

import React, { useState, useEffect } from "react";
import { createOpportunityStorage } from "@/lib/appwrite";
import { OpportunityPostProps } from "@/types/interfaces";
import { useQueryClient } from "@tanstack/react-query";
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


const OpportunityPost: React.FC<OpportunityPostProps> = ({
  opportunity,
  onBookmarkChange,
  initialIsBookmarked,
}) => {
  const { images, title } = opportunity;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    Boolean(initialIsBookmarked)
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleEditSuccess = () => {
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const [showComments, setShowComments] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalIndex, setModalIndex] = useState<number>(0);

  const queryClient = useQueryClient();



  const handleBookmarkChange = async (opportunityId: string, bookmarked: boolean): Promise<void> => {
    setIsBookmarked(bookmarked);
    if (onBookmarkChange) {
      onBookmarkChange(opportunityId, bookmarked);
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
              onCancel={handleEditCancel}
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
