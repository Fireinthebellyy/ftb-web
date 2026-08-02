"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

type Popup = {
  id: string;
  title: string;
  type: "text" | "image";
  content: string | null;
  images: string[];
  delaySeconds: number;
  isActive: boolean;
};

interface PopupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  popupToEdit: Popup | null;
}

export default function PopupFormModal({
  isOpen,
  onClose,
  popupToEdit,
}: PopupFormModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"text" | "image">("text");
  const [content, setContent] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (popupToEdit) {
      setTitle(popupToEdit.title);
      setType(popupToEdit.type);
      setContent(popupToEdit.content || "");
      setDelaySeconds(popupToEdit.delaySeconds);
      setIsActive(popupToEdit.isActive);
      setImages(popupToEdit.images || []);
    } else {
      setTitle("");
      setType("text");
      setContent("");
      setDelaySeconds(0);
      setIsActive(false);
      setImages([]);
    }
  }, [popupToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Popup>) => {
      const url = popupToEdit
        ? `/api/admin/popups/${popupToEdit.id}`
        : "/api/admin/popups";
      const method = popupToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save popup");
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Popup ${popupToEdit ? "updated" : "created"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      onClose();
    },
    onError: () => {
      toast.error("Failed to save popup");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploaded = await uploadFileViaSignedUrl({
        file,
        domain: "opportunity-images", // Reusing opportunity-images for general admin images
      });
      setImages([...images, uploaded.publicUrl]);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    if (type === "text" && !content.trim()) {
      toast.error("Content is required for text popups");
      return;
    }

    if (type === "image" && images.length === 0) {
      toast.error("At least one image is required for image popups");
      return;
    }

    saveMutation.mutate({
      title,
      type,
      content: type === "text" ? content : null,
      images: type === "image" ? images : [],
      delaySeconds,
      isActive,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {popupToEdit ? "Edit Popup" : "Create Popup"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title (Internal Name)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Sale Popup"
            />
          </div>

          <div className="grid gap-2">
            <Label>Popup Type</Label>
            <Select
              value={type}
              onValueChange={(val: "text" | "image") => setType(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Content</SelectItem>
                <SelectItem value="image">Image(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "text" && (
            <div className="grid gap-2">
              <Label htmlFor="content">Text Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the message to display..."
                rows={5}
              />
            </div>
          )}

          {type === "image" && (
            <div className="grid gap-4">
              <Label>Images</Label>
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-md border p-2">
                      <div className="relative aspect-video">
                        <Image
                          src={img}
                          alt="Popup image"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label={`Remove image ${idx + 1}`}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  disabled={isUploading}
                  className="w-full relative"
                  asChild
                >
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      "Uploading..."
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </label>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                You can upload multiple images. They will be displayed as a carousel.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="delay">Delay (seconds)</Label>
              <Input
                id="delay"
                type="number"
                min={0}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Time to wait before showing the popup.
              </p>
            </div>

            <div className="flex flex-col gap-2 justify-center pt-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Popup"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
