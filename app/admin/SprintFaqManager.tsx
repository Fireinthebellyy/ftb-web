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
import { cn } from "@/lib/utils";
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
        <DialogContent className="w-full max-w-[96vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white text-gray-900 border border-gray-200 shadow-xl rounded-2xl">
          <DialogHeader className="px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6 sm:pr-8">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  Sprint FAQs
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage questions, answers, and image banners for <span className="font-semibold text-gray-900">{sprintTitle}</span>
                </p>
              </div>
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5 h-8 shadow-xs self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" /> Add FAQ
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-gray-50/40">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full bg-gray-200/70 rounded-xl" />
                <Skeleton className="h-24 w-full bg-gray-200/70 rounded-xl" />
                <Skeleton className="h-24 w-full bg-gray-200/70 rounded-xl" />
              </div>
            ) : faqs.length === 0 ? (
              <div className="py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No FAQs added for this sprint yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Add common questions and helpful explanations to clarify sprint details for participants.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={handleOpenCreate}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First FAQ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className={cn(
                      "p-4 sm:p-5 rounded-xl border bg-white shadow-xs hover:border-gray-300 hover:shadow-sm transition-all space-y-3",
                      !faq.isActive && "bg-gray-50/80 opacity-70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1 pt-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(index, "up")}
                            className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === faqs.length - 1}
                            onClick={() => handleMoveOrder(index, "down")}
                            className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-gray-400">
                              #{index + 1}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-bold rounded-full border",
                                faq.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              )}
                            >
                              {faq.isActive ? "Active" : "Draft"}
                            </span>
                            {faq.imageUrl && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Image Banner
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-gray-900 break-words leading-snug">
                            {faq.question}
                          </h4>

                          {faq.answer && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 break-words leading-relaxed">
                              {faq.answer}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <div className="flex items-center mr-1">
                          <Switch
                            checked={faq.isActive}
                            onCheckedChange={() => handleToggleActive(faq)}
                            title={faq.isActive ? "Active" : "Draft"}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(faq)}
                          className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 p-0 rounded-lg"
                          title="Edit FAQ"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {faq.imageUrl && (
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                        <div className="w-16 h-10 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shrink-0 shadow-2xs">
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
                        <span className="text-[11px] text-gray-500 truncate max-w-md font-mono">
                          {faq.imageUrl}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-white text-xs"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit FAQ Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="w-full max-w-[96vw] sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white text-gray-900 border border-gray-200 shadow-xl rounded-2xl">
          <DialogHeader className="px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              {editingFaq ? "Edit FAQ" : "Add New FAQ"}
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Add or update frequently asked questions for this sprint.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Question *</Label>
              <Input
                placeholder="e.g., What are the prerequisites for this sprint?"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-amber-500/20 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Text Answer</Label>
              <Textarea
                placeholder="Provide the detailed explanation or instructions..."
                rows={4}
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-amber-500/20 text-sm resize-y"
              />
            </div>

            {/* Image Upload Feature */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Image Banner (Optional)</span>
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
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
                <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-2.5 space-y-2">
                  <div className="relative max-h-48 flex items-center justify-center overflow-hidden rounded-lg bg-white border border-gray-100">
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
                      className="border-gray-300 text-gray-700 hover:bg-white text-xs h-7 gap-1"
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
                    <span className="text-[11px] text-gray-500 truncate max-w-[200px] font-mono">
                      {formData.imageUrl}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  className={cn(
                    "rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50/20 bg-gray-50/60 p-6 flex flex-col items-center justify-center cursor-pointer transition text-center space-y-2",
                    isUploadingImage && "opacity-50 pointer-events-none"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    {isUploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {isUploadingImage
                        ? `Uploading Image (${uploadProgress}%)...`
                        : "Click to upload Image Banner"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
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
                    className="text-[11px] text-amber-700 hover:text-amber-800 underline font-medium"
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
                      className="bg-white border-gray-300 text-gray-900 text-xs h-8"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <Label className="text-xs font-semibold text-gray-700">Active Status</Label>
                <p className="text-[11px] text-gray-500">
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

          <DialogFooter className="px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormDialogOpen(false)}
              disabled={isSubmitting || isUploadingImage}
              className="border-gray-300 text-gray-700 hover:bg-white text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFaq}
              size="sm"
              disabled={isSubmitting || isUploadingImage}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs"
            >
              {isSubmitting ? "Saving..." : editingFaq ? "Update FAQ" : "Create FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
