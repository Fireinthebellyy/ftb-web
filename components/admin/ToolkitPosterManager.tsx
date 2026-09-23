"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ToolkitImageInput } from "./ToolkitImageInput";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";

type LastCohortPoster = {
  id: string;
  imageUrl: string;
  isActive: boolean;
};

export function ToolkitPosterManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const queryClient = useQueryClient();

  const { data: poster, isLoading } = useQuery({
    queryKey: ["admin", "toolkit-last-cohort-poster"],
    queryFn: async () =>
      (
        await axios.get<LastCohortPoster | null>(
          "/api/admin/toolkit-last-cohort-poster"
        )
      ).data,
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (newImageUrl: string) => {
      return axios.post("/api/admin/toolkit-last-cohort-poster", {
        imageUrl: newImageUrl,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "toolkit-last-cohort-poster"],
      });

      toast.success("Last cohort poster updated");
      setImageFile(null);
      setImageUrl("");
    },
    onError: () => {
      toast.error("Failed to update last cohort poster");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/toolkit-last-cohort-poster/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "toolkit-last-cohort-poster"],
      });

      toast.success("Last cohort poster removed");
    },
    onError: () => {
      toast.error("Failed to remove last cohort poster");
    },
  });

  const handleSave = async () => {
    try {
      let uploadedUrl = imageUrl;

      if (imageFile) {
        const uploaded = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: imageFile,
        });

        uploadedUrl = uploaded.publicUrl;
      }

      if (!uploadedUrl) {
        toast.error("Please select a poster");
        return;
      }

      await saveMutation.mutateAsync(uploadedUrl);
    } catch (_error) {
      toast.error("Error uploading poster");
    }
  };

  const handleClose = () => {
    setImageFile(null);
    setImageUrl("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Last Poster</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Poster */}
          <div className="rounded-lg border bg-gray-50/50 p-4">
            <h3 className="mb-3 text-sm font-medium">Current Poster</h3>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : poster ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border bg-white">
                  <img
                    src={poster.imageUrl}
                    alt="Last cohort poster"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm("Remove the current last cohort poster?")) {
                      deleteMutation.mutate(poster.id);
                    }
                  }}
                >
                  {deleteMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Poster
                </Button>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">
                No poster added yet.
              </p>
            )}
          </div>

          {/* Upload / Replace */}
          <div className="rounded-lg border bg-gray-50/50 p-4">
            <h3 className="mb-3 text-sm font-medium">
              {poster ? "Replace Poster" : "Add Poster"}
            </h3>

            <ToolkitImageInput
              label="last-cohort-poster"
              selectedFile={imageFile}
              onFileSelect={setImageFile}
              onRemove={() => {
                setImageFile(null);
                setImageUrl("");
              }}
              imageUrl={imageUrl}
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={handleSave}
              >
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {poster ? "Replace Poster" : "Add Poster"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}