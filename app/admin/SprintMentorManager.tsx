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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Edit,
  Users,
  ArrowUp,
  ArrowDown,
  UploadCloud,
  Loader2,
  RefreshCw,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";
import { cn } from "@/lib/utils";

export interface SprintMentorItem {
  id: string;
  sprintId: string;
  name: string;
  role: string;
  imageUrl?: string | null;
  bio?: string | null;
  link?: string | null;
  orderIndex: number;
  createdAt?: string;
}

interface SprintMentorManagerProps {
  sprintId: string;
  sprintTitle: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface MentorFormData {
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  link: string;
}

const EMPTY_FORM: MentorFormData = {
  name: "",
  role: "",
  imageUrl: "",
  bio: "",
  link: "",
};

export default function SprintMentorManager({
  sprintId,
  sprintTitle,
  open,
  onClose,
  onUpdate,
}: SprintMentorManagerProps) {
  const [mentors, setMentors] = useState<SprintMentorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<SprintMentorItem | null>(null);
  const [formData, setFormData] = useState<MentorFormData>(EMPTY_FORM);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/sprints/${sprintId}/mentors`);
      setMentors(res.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to load mentors");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    if (open && sprintId) {
      fetchMentors();
    }
  }, [open, sprintId, fetchMentors]);

  const handleOpenCreate = () => {
    if (mentors.length >= 2) {
      toast.error("Maximum 2 mentors allowed per sprint");
      return;
    }
    setEditingMentor(null);
    setFormData(EMPTY_FORM);
    setShowUrlInput(false);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (mentor: SprintMentorItem) => {
    setEditingMentor(mentor);
    setFormData({
      name: mentor.name || "",
      role: mentor.role || "",
      imageUrl: mentor.imageUrl || "",
      bio: mentor.bio || "",
      link: mentor.link || "",
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
      toast.success("Mentor photo uploaded successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload mentor photo");
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveMentor = async () => {
    if (!formData.name.trim()) {
      toast.error("Mentor name is required");
      return;
    }

    try {
      setSaving(true);
      if (editingMentor) {
        // Update existing mentor
        await axios.put(`/api/admin/sprints/${sprintId}/mentors/${editingMentor.id}`, {
          name: formData.name.trim(),
          role: formData.role.trim(),
          imageUrl: formData.imageUrl.trim() || null,
          bio: formData.bio.trim() || null,
          link: formData.link.trim() || null,
        });
        toast.success("Mentor updated successfully");
      } else {
        // Create new mentor
        if (mentors.length >= 2) {
          toast.error("Maximum 2 mentors allowed per sprint");
          return;
        }
        await axios.post(`/api/admin/sprints/${sprintId}/mentors`, {
          name: formData.name.trim(),
          role: formData.role.trim(),
          imageUrl: formData.imageUrl.trim() || null,
          bio: formData.bio.trim() || null,
          link: formData.link.trim() || null,
          orderIndex: mentors.length,
        });
        toast.success("Mentor added successfully");
      }

      setFormDialogOpen(false);
      await fetchMentors();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save mentor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMentor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mentor?")) return;
    try {
      await axios.delete(`/api/admin/sprints/${sprintId}/mentors/${id}`);
      toast.success("Mentor removed successfully");
      await fetchMentors();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete mentor");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mentors.length) return;

    const newMentors = [...mentors];
    const [moved] = newMentors.splice(index, 1);
    newMentors.splice(targetIndex, 0, moved);

    const reordered = newMentors.map((m, idx) => ({
      ...m,
      orderIndex: idx,
    }));

    setMentors(reordered);

    try {
      await axios.put(`/api/admin/sprints/${sprintId}/mentors`, {
        mentors: reordered,
      });
      toast.success("Mentors order updated");
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update mentor order");
      fetchMentors();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="w-full max-w-[96vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white text-gray-900 border border-gray-200 shadow-xl rounded-2xl">
          <DialogHeader className="px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6 sm:pr-8">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 shrink-0" />
                  Sprint Mentors
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Managing mentors for: <span className="text-gray-900 font-semibold">{sprintTitle}</span>
                </p>
              </div>
              <span
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-full border self-start sm:self-auto shrink-0",
                  mentors.length === 2
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : mentors.length === 1
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                )}
              >
                {mentors.length} / 2 Mentors Added (Max 2)
              </span>
            </div>
          </DialogHeader>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="text-xs text-gray-500">
              {mentors.length === 0 ? (
                <span>No mentors added yet. Click &quot;Add Mentor&quot; to begin.</span>
              ) : mentors.length === 1 ? (
                <span>1 mentor added (will appear centered or tilted). You can add 1 more.</span>
              ) : (
                <span>2 mentors added. Card 1 tilts left (-2°), Card 2 tilts right (+2°) on the detail page.</span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchMentors}
                disabled={loading}
                className="border-gray-300 text-gray-700 hover:bg-white text-xs h-8"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={handleOpenCreate}
                disabled={mentors.length >= 2}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 h-8 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> Add Mentor
              </Button>
            </div>
          </div>

          {/* Mentors List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-gray-50/40">
            {loading && mentors.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full bg-gray-200/70 rounded-xl" />
                <Skeleton className="h-28 w-full bg-gray-200/70 rounded-xl" />
              </div>
            ) : mentors.length === 0 ? (
              <div className="py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No mentors added for this sprint yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Add up to 2 mentors. The cards will display on the sprint detail page with dynamic opposing tilts.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={handleOpenCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Mentor
                  </Button>
                </div>
              </div>
            ) : (
              mentors.map((mentor, index) => (
                <div
                  key={mentor.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    {/* Position & Tilt Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-16 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {index === 0 ? "Left Card" : "Right Card"}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full mt-1 border",
                          index === 0
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        )}
                      >
                        {index === 0 ? "Tilt -2°" : "Tilt +2°"}
                      </span>
                    </div>

                    {/* Mentor Image Preview */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center shadow-xs">
                      {mentor.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mentor.imageUrl}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Mentor Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                          {mentor.name}
                        </h4>
                        {mentor.link && (
                          <a
                            href={mentor.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded-md transition"
                            title="LinkedIn Profile"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {mentor.role && (
                        <p className="text-xs text-orange-600 font-semibold truncate">
                          {mentor.role}
                        </p>
                      )}
                      {mentor.bio && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {mentor.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 rounded-lg"
                      title="Move Up (Left Card)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === mentors.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 rounded-lg"
                      title="Move Down (Right Card)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(mentor)}
                      className="h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 gap-1 rounded-lg"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMentor(mentor.id)}
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg"
                      title="Delete Mentor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
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

      {/* Add / Edit Mentor Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="w-full max-w-[96vw] sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white text-gray-900 border border-gray-200 shadow-xl rounded-2xl">
          <DialogHeader className="px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              {editingMentor ? "Edit Sprint Mentor" : "Add Sprint Mentor"}
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Fill in mentor details to display on the sprint registration page.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Mentor Name *</Label>
              <Input
                placeholder="e.g., Alex Rivera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Role / Tagline</Label>
              <Input
                placeholder="e.g., Growth Lead, Ex-Swiggy"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
            </div>

            {/* Mentor Image Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">Mentor Photo (Full Card Image)</Label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  {showUrlInput ? "Use File Upload" : "Or enter Image URL"}
                </button>
              </div>

              {formData.imageUrl && (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.imageUrl}
                    alt="Mentor preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs bg-white text-gray-900 hover:bg-gray-100"
                    >
                      Replace Image
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {!formData.imageUrl && !showUrlInput && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/20 rounded-xl p-6 text-center cursor-pointer bg-gray-50/60 transition",
                    isUploadingImage && "opacity-50 pointer-events-none"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {isUploadingImage ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                      <p className="text-xs text-gray-600 font-medium">
                        Uploading photo... {uploadProgress > 0 ? `${uploadProgress}%` : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-gray-800">
                        Click to upload mentor photo
                      </p>
                      <p className="text-[11px] text-gray-500">
                        PNG, JPG, WebP up to 5MB (Portrait/Vertical image recommended)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {showUrlInput && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900 text-sm"
                  />
                  {formData.imageUrl && (
                    <a
                      href={formData.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-gray-900"
                      title="Open image in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                LinkedIn Profile URL
              </Label>
              <Input
                placeholder="https://www.linkedin.com/in/username"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Bio (Optional brief intro)</Label>
              <Textarea
                placeholder="Brief summary of mentor's background and achievements..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 text-sm resize-y"
              />
            </div>
          </div>

          <DialogFooter className="px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveMentor}
              disabled={saving || isUploadingImage}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : editingMentor ? (
                "Update Mentor"
              ) : (
                "Save Mentor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
