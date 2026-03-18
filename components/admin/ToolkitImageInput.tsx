"use client";

import { ChangeEvent, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ToolkitImageInputProps {
  label: string;
  imageUrl?: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  disabled?: boolean;
  required?: boolean;
}

export function ToolkitImageInput({
  label,
  imageUrl,
  selectedFile,
  onFileSelect,
  onRemove,
  disabled = false,
  required = false,
}: ToolkitImageInputProps) {
  const selectedFilePreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : ""),
    [selectedFile]
  );

  useEffect(() => {
    return () => {
      if (selectedFilePreviewUrl) {
        URL.revokeObjectURL(selectedFilePreviewUrl);
      }
    };
  }, [selectedFilePreviewUrl]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileSelect(file ?? null);
    event.target.value = "";
  };

  const previewSrc = selectedFilePreviewUrl || imageUrl || "";

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled}
          required={required && !selectedFile && !imageUrl}
        />
        {previewSrc ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {selectedFile ? (
        <p className="text-muted-foreground text-xs">
          Selected: {selectedFile.name}
        </p>
      ) : null}

      {previewSrc ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-zinc-50">
          <Image
            src={previewSrc}
            alt={`${label} preview`}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      ) : null}
    </div>
  );
}
