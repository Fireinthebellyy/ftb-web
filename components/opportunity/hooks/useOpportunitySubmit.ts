"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { createOpportunityStorage, getAppwriteErrorMessage } from "@/lib/appwrite";
import { FileItem, Opportunity, UploadProgress } from "@/types/interfaces";
import { FormData } from "../schema";

interface UseOpportunitySubmitProps {
    opportunity?: Opportunity;
    files: FileItem[];
    setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
    existingImages: string[];
    onOpportunityCreated: () => void;
    setRemovedImageIds: React.Dispatch<React.SetStateAction<string[]>>;
    removedImageIds: string[];
}

export function useOpportunitySubmit({
    opportunity,
    files,
    setFiles,
    existingImages,
    onOpportunityCreated,
    setRemovedImageIds,
    removedImageIds
}: UseOpportunitySubmitProps) {
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    async function uploadImages(): Promise<{ ids: string[]; success: boolean }> {
        if (files.length === 0) return { ids: [], success: true };

        const uploadedFileIds: string[] = [];
        let hasError = false;

        setFiles((prev) =>
            prev.map((file) => ({ ...file, uploading: true, progress: 0 }))
        );

        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID;
        if (!bucketId) {
            console.error("Missing Appwrite Opportunities Bucket ID");
            return { ids: [], success: false };
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const opportunityStorage = createOpportunityStorage();

                const res = await opportunityStorage.createFile(
                    bucketId,
                    "unique()",
                    file.file,
                    [],
                    (progress: UploadProgress) => {
                        const percent = Math.round(progress.progress || 0);
                        setFiles((prev) =>
                            prev.map((f, idx) =>
                                idx === i ? { ...f, progress: percent } : f
                            )
                        );
                    }
                );

                uploadedFileIds.push(res.$id);
                setFiles((prev) =>
                    prev.map((f, idx) =>
                        idx === i ? { ...f, uploading: false, fileId: res.$id } : f
                    )
                );
            } catch (err) {
                console.error(`Upload failed for ${file.name}:`, err);
                hasError = true;
                const errorMessage = getAppwriteErrorMessage(err);
                setFiles((prev) =>
                    prev.map((f, idx) =>
                        idx === i
                            ? {
                                ...f,
                                uploading: false,
                                error: true,
                                errorMessage,
                            }
                            : f
                    )
                );
                toast.error(`Failed to upload "${file.name}": ${errorMessage}`);
            }
        }

        return { ids: uploadedFileIds, success: !hasError };
    }

    async function deleteRemovedImages(): Promise<void> {
        if (removedImageIds.length === 0) return;

        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID;
        if (!bucketId) return;

        const opportunityStorage = createOpportunityStorage();

        for (const imageId of removedImageIds) {
            try {
                await opportunityStorage.deleteFile(bucketId, imageId);
            } catch (err) {
                console.error(`Failed to delete image ${imageId}:`, err);
                // Continue deleting other images even if one fails
            }
        }
    }

    async function onSubmit(data: FormData) {
        setLoading(true);

        try {
            const { ids: imageIds, success: imagesOk } = await uploadImages();


            if (!imagesOk) {
                toast.error(
                    `One or more images failed to upload. Fix the failed uploads and try again. ${opportunity ? "Post was not updated." : "Post was not created."}`
                );
                return;
            }

            // Combine existing images with newly uploaded images
            const finalImages = [...existingImages, ...imageIds];

            // Destructure to prevent leaking complex objects into payload
            const { dateRange, tags: _tags, ...restData } = data;

            const payload = {
                ...restData,
                startDate: dateRange?.from?.toISOString(),
                endDate: dateRange?.to?.toISOString(),
                tags:
                    data.tags
                        ?.split(",")
                        .map((t) => t.trim())
                        .filter(Boolean) || [],
                // For edit mode: always send the final images array (existing + new)
                // For create mode: only send if there are images
                images: opportunity?.id
                    ? finalImages
                    : (imageIds.length > 0 ? imageIds : undefined),
            };

            let res;
            if (opportunity?.id) {
                res = await axios.put(`/api/opportunities/${opportunity.id}`, payload);
                if (res.status !== 200) throw new Error("Failed to update opportunity");

                // Delete removed images from Appwrite storage after successful update
                await deleteRemovedImages();
            } else {
                res = await axios.post("/api/opportunities", payload);
                if (res.status !== 200 && res.status !== 201)
                    throw new Error("Failed to create opportunity");
            }

            files.forEach((file) => URL.revokeObjectURL(file.preview));
            setFiles([]);
            setRemovedImageIds([]);

            // Check user role to show appropriate message
            const userRole = res.data?.userRole || "user"; // The API should return user role
            const needsReview = userRole === "user";

            toast.success(
                opportunity?.id
                    ? "Opportunity updated successfully!"
                    : needsReview
                        ? "Opportunity submitted for review! It will be visible once approved by an admin."
                        : "Opportunity submitted successfully!"
            );
            queryClient.invalidateQueries({ queryKey: ["opportunities"] });
            onOpportunityCreated();
        } catch (err: unknown) {
            if (err instanceof Error) {
                toast.error(err.message);
            } else {
                toast.error("Unknown error occurred");
            }
            throw err; // Re-throw for testing if needed
        } finally {
            setLoading(false);
        }
    }

    return { onSubmit, loading, uploadImages, deleteRemovedImages };
}
