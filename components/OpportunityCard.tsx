"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { createOpportunityStorage } from "@/lib/appwrite";
import { OpportunityPostProps } from "@/types/interfaces";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
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

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const OpportunityPost: React.FC<OpportunityPostProps> = ({
  opportunity,
  onBookmarkChange,
  initialIsBookmarked,
}) => {
  const { id, images, title } = opportunity;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    Boolean(initialIsBookmarked)
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const _handleEditSuccess = () => {
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  };

  const _handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDeletePost = async () => {
    try {
      const res = await axios.delete(`/api/opportunities/${id}`);
      if (res.status === 200 || res.status === 204) {
        toast.success("Post deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };
  const [isBookmarkLoading, setIsBookmarkLoading] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const isExpanded = true;

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalIndex, setModalIndex] = useState<number>(0);
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState<boolean>(false);
  const [showMessage, setShowMessage] = useState<boolean>(false);

  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (typeof isBookmarkedServer === "boolean") {
      setIsBookmarked(isBookmarkedServer);
    }
  }, [isBookmarkedServer]);



  const handleBookmark = async (): Promise<void> => {
    if (isBookmarkLoading) return;

    if (!session?.user?.id) {
      toast.error("Please log in to bookmark opportunities");
      return;
    }

    if (!isValidUUID(id)) {
      console.error("Invalid opportunity ID format");
      return;
    }

    const currentUserId = session.user.id as string;

    try {
      if (newState) {
        const response = await axios.post("/api/bookmarks", {
          userId: currentUserId,
          opportunityId: id,
        });
        if (response.data?.message === "Already bookmarked") {
          toast.info("Already bookmarked");
        }
      } else {
        await axios.delete("/api/bookmarks", {
          data: {
            userId: currentUserId,
            opportunityId: id,
          },
        });
      }

      setIsBookmarked(newState);

      if (onBookmarkChange) {
        onBookmarkChange(id, newState);
      }

      queryClient.invalidateQueries({ queryKey: ["bookmark", id] });

      if (newBookmarkState) {
        const skipBookmarkModal = localStorage.getItem('skipBookmarkModal');
        if (skipBookmarkModal === 'true') {
          toast.success("Bookmark added!");
        } else {
          setBookmarkModalOpen(true);
        }
      } else {
        toast.success("Removed from bookmarks");
      }
    } catch (err) {
      console.error("Bookmark request failed:", err);
      toast.error("Failed to update bookmark");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const primaryType = Array.isArray(type) ? type[0] : type;

  const getTypeColor = (type?: string): string => {
    const colors: Record<string, string> = {
      hackathon: "bg-blue-100 text-blue-800",
      grant: "bg-green-100 text-green-800",
      competition: "bg-purple-100 text-purple-800",
      ideathon: "bg-orange-100 text-orange-800",
      others: "bg-gray-100 text-gray-800",
    };
    return colors[type?.toLowerCase() || "others"] || colors.others;
  };

  const opportunityStorage = createOpportunityStorage();

  const userUpvoted = opportunity.userHasUpvoted ?? false;

  const onUpvoteClick = () => {
    if (!toggleUpvote.isPending) {
      toggleUpvote.mutate();
    }
  };

  const publicBaseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = publicBaseUrl
    ? `${publicBaseUrl}/opportunities/${id}`
    : `/opportunities/${id}`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
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
