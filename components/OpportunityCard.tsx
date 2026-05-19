"use client";

import React, { useState, useEffect } from "react";
import { OpportunityPostProps } from "@/types/interfaces";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useQueryClient } from "@tanstack/react-query";
import { useTracker } from "@/components/providers/TrackerProvider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import Image from "next/image";
import { OpportunityHeader } from "./opportunity/OpportunityHeader";
import { OpportunityImageGallery } from "./opportunity/OpportunityImageGallery";
import { OpportunityAttachments } from "./opportunity/OpportunityAttachments";
import { OpportunityActions } from "./opportunity/OpportunityActions";
import NewOpportunityForm from "./opportunity/NewOpportunityForm";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";
import { formatTypeName } from "@/app/opportunities/constants";
import { Flame } from "lucide-react";

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const resolveOpportunityDeadline = (
  startDate?: string | null,
  endDate?: string | null
): string | undefined => {
  if (endDate) return endDate;
  if (!startDate) return undefined;
  const baseDate = new Date(startDate);
  if (Number.isNaN(baseDate.getTime())) return undefined;
  return new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
};

const getTypeBadgeColor = (type?: string): string => {
  const colors: Record<string, string> = {
    competitions_open_calls: "bg-blue-100 text-blue-800",
    case_competitions: "bg-indigo-100 text-indigo-800",
    hackathons: "bg-cyan-100 text-cyan-800",
    fellowships: "bg-purple-100 text-purple-800",
    ideathon_think_tanks: "bg-orange-100 text-orange-800",
    leadership_programs: "bg-amber-100 text-amber-800",
    awards_recognition: "bg-yellow-100 text-yellow-800",
    grants_scholarships: "bg-green-100 text-green-800",
    research_paper_ra_calls: "bg-rose-100 text-rose-800",
    upskilling_events: "bg-teal-100 text-teal-800",
    others: "bg-gray-100 text-gray-800",
  };
  return colors[type?.toLowerCase() || "others"] || colors.others;
};

const OpportunityPost: React.FC<OpportunityPostProps> = ({
  opportunity,
  onBookmarkChange,
}) => {
  const { id, images, title, type } = opportunity;
  const primaryType = Array.isArray(type) ? type[0] : type;

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
        const addOutcome = await addToTracker(
          {
            id,
            opportunityId: id,
            title: opportunity.title,
            company:
              (opportunity as any).hiringOrganization ||
              opportunity.organiserInfo ||
              "Unknown Organization",
            logo: opportunity.images?.[0]
              ? tryGetStoragePublicUrl(
                  "opportunity-images",
                  opportunity.images[0]
                )
              : undefined,
            type: opportunity.type,
            location: opportunity.location,
            deadline: resolveOpportunityDeadline(
              opportunity.startDate,
              opportunity.endDate
            ),
            kind: "opportunity",
          } as any,
          "Not Applied",
          "opportunity"
        );
        if (addOutcome === "added") {
          posthog.capture("opportunity_bookmarked", {
            opportunity_id: id,
            title: opportunity.title,
            action: "save",
          });
          toast.success("Saved to Tracker");
        } else if (addOutcome === "already_exists") {
          toast.info("Already in Tracker");
        } else {
          toast.error("Failed to update bookmark");
        }
      } else {
        if (trackedItem) {
          const removed = await removeFromTracker(
            trackedItem.oppId as string | number,
            trackedItem.kind ?? "opportunity"
          );
          if (removed) {
            posthog.capture("opportunity_bookmarked", {
              opportunity_id: id,
              title: opportunity.title,
              action: "unsave",
            });
            toast.success("Deleted from Tracker");
          }
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
    <article className="relative mb-3 w-full overflow-hidden rounded-lg border bg-white shadow-sm sm:mb-4">
      {primaryType && (
        <div className="absolute -top-0.5 right-0 z-20">
          <Badge
            className={`${getTypeBadgeColor(
              primaryType
            )} rounded-tl-none rounded-br-none px-2 py-1 text-[10px] font-medium sm:text-xs`}
          >
            {formatTypeName(primaryType)}
          </Badge>
        </div>
      )}

      {/* Trending badge - below type badge on right */}
      {opportunity.trending && (
        <div className="absolute top-6 right-0 z-20">
          <Badge className="bg-orange-500 text-white rounded-tl-none rounded-br-none px-2 py-1 text-[10px] font-medium sm:text-xs">
           <Flame className="h-2.5 w-2.5 mr-0.5 inline" />Trending
          </Badge>
        </div>
      )}

      <OpportunityImageGallery
        images={images}
        title={title}
        onOpenModal={(index) => {
          setModalIndex(index);
          setModalOpen(true);
        }}
      />

      <OpportunityHeader opportunity={opportunity} />

      <OpportunityAttachments attachments={opportunity.attachments} />

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
            className="mx-auto max-h-[90vh] w-full overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-2xl [&::-webkit-scrollbar]:hidden"
            overlayClassName="backdrop-blur-xs bg-black/30"
            onOpenAutoFocus={(event) => event.preventDefault()}
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

  useEffect(() => {
    if (carouselApi) {
      setTimeout(() => carouselApi.scrollTo(modalIndex), 0);
    }
  }, [modalIndex, carouselApi]);

  if (images.length <= 1) {
    return (
      <div className="flex items-center justify-center">
        {modalFileId ? (
          <ImageModalContent fileId={modalFileId} title={title} />
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
  fileId: string;
  title: string;
}

function ImageModalContent({ fileId, title }: ImageModalContentProps) {
  return (
    <Image
      src={tryGetStoragePublicUrl("opportunity-images", fileId)}
      alt={title}
      className="max-h-[80vh] w-full object-contain"
      height={600}
      width={800}
    />
  );
}

export default OpportunityPost;