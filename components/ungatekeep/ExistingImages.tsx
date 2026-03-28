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
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";

type ExistingImagesProps = {
  existingImages: string[];
  onRemoveExisting: (imageId: string) => void;
  loading?: boolean;
};

export function ExistingImages({
  existingImages,
  onRemoveExisting,
  loading,
}: ExistingImagesProps) {
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);

  if (existingImages.length === 0) return null;

  const getImageUrl = (imageId: string) =>
    tryGetStoragePublicUrl("ungatekeep-images", imageId);

  return (
    <>
      <div className="flex flex-wrap gap-2 py-2">
        {existingImages.map((imageId) => (
          <div key={imageId} className="group relative">
            <div
              className="h-16 w-16 cursor-pointer overflow-hidden rounded-lg border bg-gray-100 transition-opacity hover:opacity-90"
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
                className="h-full w-full object-cover"
                width={64}
                height={64}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white p-0 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                if (loading) return;
                onRemoveExisting(imageId);
              }}
              disabled={loading}
            >
              <X className="h-2 w-2" />
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
          className="max-w-3xl overflow-hidden p-0"
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
                className="h-auto max-h-[80vh] w-full object-contain"
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
