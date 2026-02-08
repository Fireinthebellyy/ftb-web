"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createUngatekeepStorage, getUngatekeepBucketId } from "@/lib/appwrite";

type ExistingImagesProps = {
  existingImages: string[];
  onRemoveExisting: (imageId: string) => void;
};

export function ExistingImages({
  existingImages,
  onRemoveExisting,
}: ExistingImagesProps) {
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const ungatekeepStorage = createUngatekeepStorage();
  const bucketId = getUngatekeepBucketId();

  if (existingImages.length === 0) return null;
  if (!bucketId) return null; // Gracefully handle missing bucket ID

  const getImageUrl = (imageId: string) =>
    ungatekeepStorage.getFileView(bucketId, imageId);

  return (
    <>
      <div className="flex flex-wrap gap-2 py-2">
        {existingImages.map((imageId) => (
          <div key={imageId} className="relative group">
            <div
              className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setPreviewImageId(imageId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setPreviewImageId(imageId);
                }
              }}
            >
              <Image
                src={getImageUrl(imageId)}
                alt="Existing image"
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-white hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveExisting(imageId);
              }}
            >
              <X className="w-2 h-2" />
            </Button>
          </div>
        ))}
      </div>

      {/* Full image preview modal */}
      <Dialog
        open={previewImageId !== null}
        onOpenChange={(open) => !open && setPreviewImageId(null)}
      >
        <DialogContent
          className="max-w-3xl p-0 overflow-hidden"
          overlayClassName="bg-black/70"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImageId && (
            <div className="relative">
              <Image
                src={getImageUrl(previewImageId)}
                alt="Full preview"
                className="w-full h-auto max-h-[80vh] object-contain"
                width={800}
                height={600}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
