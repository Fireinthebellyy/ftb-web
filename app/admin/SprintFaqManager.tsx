"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Edit,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";
import { type SprintFaq } from "@/types/interfaces";

interface SprintFaqManagerProps {
  sprintId: string;
  sprintTitle: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface FaqFormData {
  question: string;
  answer: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: FaqFormData = {
  question: "",
  answer: "",
  imageUrl: "",
  isActive: true,
};

export default function SprintFaqManager({
  sprintId,
  sprintTitle,
  open,
  onClose,
  onUpdate,
}: SprintFaqManagerProps) {
  const [faqs, setFaqs] = useState<SprintFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<SprintFaq | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FaqFormData>(EMPTY_FORM);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/sprints/${sprintId}/faqs`);
      setFaqs(res.data || []);
    } catch (err) {
      console.error("Error fetching sprint FAQs:", err);
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    if (open && sprintId) {
      fetchFaqs();
    }
  }, [open, sprintId, fetchFaqs]);

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setFormData(EMPTY_FORM);
    setShowUrlInput(false);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (faq: SprintFaq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || "",
      answer: faq.answer || "",
      imageUrl: faq.imageUrl || "",
      isActive: faq.isActive !== undefined ? faq.isActive : true,
    });
    setShowUrlInput(false);
    setFormDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WebP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size exceeds 5MB limit");
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadProgress(0);

      const uploaded = await uploadFileViaSignedUrl({
        domain: "opportunity-images",
        file,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      setFormData((prev) => ({
        ...prev,
        imageUrl: uploaded.publicUrl,
      }));
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      console.error("Error uploading image:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveFaq = async () => {
    if (!formData.question.trim()) {
      toast.error("Question is required");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingFaq) {
        await axios.put(`/api/admin/sprints/${sprintId}/faqs/${editingFaq.id}`, {
          question: formData.question.trim(),
          answer: formData.answer.trim() || null,
          imageUrl: formData.imageUrl.trim() || null,
          isActive: formData.isActive,
        });
        toast.success("FAQ updated successfully");
      } else {
        await axios.post(`/api/admin/sprints/${sprintId}/faqs`, {
          question: formData.question.trim(),
          answer: formData.answer.trim() || null,
          imageUrl: formData.imageUrl.trim() || null,
          orderIndex: faqs.length,
          isActive: formData.isActive,
        });
        toast.success("FAQ created successfully");
      }
      setFormDialogOpen(false);
      fetchFaqs();
      onUpdate?.();
    } catch (err: any) {
      console.error("Error saving FAQ:", err);
      toast.error(err.response?.data?.error || "Failed to save FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await axios.delete(`/api/admin/sprints/${sprintId}/faqs/${id}`);
      toast.success("FAQ deleted");
      fetchFaqs();
      onUpdate?.();
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      toast.error("Failed to delete FAQ");
    }
  };

  const handleToggleActive = async (faq: SprintFaq) => {
    try {
      const nextActive = !faq.isActive;
      await axios.put(`/api/admin/sprints/${sprintId}/faqs/${faq.id}`, {
        isActive: nextActive,
      });
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, isActive: nextActive } : f))
      );
      toast.success(nextActive ? "FAQ activated" : "FAQ set to draft");
      onUpdate?.();
    } catch (err) {
      console.error("Error toggling FAQ status:", err);
      toast.error("Failed to update status");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    const temp = newFaqs[index];
    newFaqs[index] = newFaqs[targetIndex];
    newFaqs[targetIndex] = temp;

    setFaqs(newFaqs);

    try {
      await axios.put(`/api/admin/sprints/${sprintId}/faqs`, {
        faqs: newFaqs.map((f, idx) => ({ id: f.id, orderIndex: idx })),
      });
      toast.success("Order updated");
      onUpdate?.();
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Failed to persist new order");
      fetchFaqs();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-white max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  Sprint FAQs
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage questions, answers, and image banners for {sprintTitle}
                </p>
              </div>
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Plus className="w-4 h-4" /> Add FAQ
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full bg-zinc-800" />
                <Skeleton className="h-20 w-full bg-zinc-800" />
                <Skeleton className="h-20 w-full bg-zinc-800" />
              </div>
            ) : faqs.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                No FAQs added for this sprint yet. Click &quot;Add FAQ&quot; to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1 pt-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(index, "up")}
                            className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-500"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === faqs.length - 1}
                            onClick={() => handleMoveOrder(index, "down")}
                            className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-500"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-500">
                              #{index + 1}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                faq.isActive
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {faq.isActive ? "Active" : "Draft"}
                            </span>
                            {faq.imageUrl && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Image Banner
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-semibold text-white break-words">
                            {faq.question}
                          </h4>

                          {faq.answer && (
                            <p className="text-xs text-zinc-400 line-clamp-2 break-words">
                              {faq.answer}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={faq.isActive}
                          onCheckedChange={() => handleToggleActive(faq)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(faq)}
                          className="text-zinc-400 hover:text-white h-8 w-8 p-0"
                          title="Edit FAQ"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {faq.imageUrl && (
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-3">
                        <div className="w-16 h-10 rounded border border-zinc-800 bg-zinc-900 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={faq.imageUrl}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-zinc-500 truncate max-w-md">
                          {faq.imageUrl}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-zinc-800">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit FAQ Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-lg bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? "Edit FAQ" : "Add New FAQ"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Question *</Label>
              <Input
                placeholder="e.g., What are the prerequisites for this sprint?"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                className="bg-zinc-950 border-zinc-800 mt-1.5"
              />
            </div>

            <div>
              <Label>Text Answer</Label>
              <Textarea
                placeholder="Provide the detailed explanation or instructions..."
                rows={4}
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                className="bg-zinc-950 border-zinc-800 mt-1.5 resize-y"
              />
            </div>

            {/* Image Upload Feature */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Image Banner (Optional)</span>
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Image
                  </button>
                )}
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {formData.imageUrl ? (
                <div className="relative rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 p-2 space-y-2">
                  <div className="relative max-h-48 flex items-center justify-center overflow-hidden rounded-lg bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="Uploaded Banner Preview"
                      className="max-h-44 object-contain rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-zinc-700 text-zinc-300 text-xs h-7 gap-1"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          <span>Replace Image</span>
                        </>
                      )}
                    </Button>
                    <span className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                      {formData.imageUrl}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/70 p-6 flex flex-col items-center justify-center cursor-pointer transition text-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    {isUploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-zinc-200">
                      {isUploadingImage
                        ? `Uploading Image (${uploadProgress}%)...`
                        : "Click to upload Image Banner"}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      PNG, JPG, WebP, GIF up to 5MB
                    </p>
                  </div>
                </div>
              )}

              {/* Collapsed URL paste option */}
              <div className="pt-1">
                {!showUrlInput && !formData.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Or paste image URL directly
                  </button>
                ) : showUrlInput ? (
                  <div className="space-y-1 pt-1">
                    <Input
                      placeholder="https://images.unsplash.com/... or CDN link"
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      className="bg-zinc-950 border-zinc-800 text-xs h-8"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div>
                <Label>Active Status</Label>
                <p className="text-[11px] text-zinc-500">
                  Visible to users on the sprint detail page
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, isActive: val })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={isSubmitting || isUploadingImage}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFaq}
              disabled={isSubmitting || isUploadingImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? "Saving..." : editingFaq ? "Update FAQ" : "Create FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
