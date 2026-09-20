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
        <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-white max-h-[85vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Sprint Mentors
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-1">
                  Managing mentors for: <span className="text-white font-medium">{sprintTitle}</span>
                </p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                mentors.length === 2
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : mentors.length === 1
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}>
                {mentors.length} / 2 Mentors Added (Max 2)
              </span>
            </div>
          </DialogHeader>

          {/* Action Bar */}
          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div className="text-xs text-zinc-400">
              {mentors.length === 0 ? (
                <span>No mentors added yet. Click &quot;Add Mentor&quot; to begin.</span>
              ) : mentors.length === 1 ? (
                <span>1 mentor added (will appear centered or tilted). You can add 1 more.</span>
              ) : (
                <span>2 mentors added. Card 1 tilts left, Card 2 tilts right on the detail page.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchMentors}
                disabled={loading}
                className="border-zinc-700 text-zinc-300 hover:text-white"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                onClick={handleOpenCreate}
                disabled={mentors.length >= 2}
                className="bg-[#ff5e14] hover:bg-[#e04f0b] text-white text-xs gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> Add Mentor
              </Button>
            </div>
          </div>

          {/* Mentors List */}
          <div className="space-y-3 py-4 flex-1">
            {loading && mentors.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full bg-zinc-800" />
                <Skeleton className="h-24 w-full bg-zinc-800" />
              </div>
            ) : mentors.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl space-y-2">
                <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm font-medium">No mentors added for this sprint yet</p>
                <p className="text-xs text-zinc-500">
                  Add up to 2 mentors. The cards will display on the sprint detail page with dynamic opposing tilts.
                </p>
              </div>
            ) : (
              mentors.map((mentor, index) => (
                <div
                  key={mentor.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Position & Tilt Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-16 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {index === 0 ? "Left Card" : "Right Card"}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 ${
                        index === 0 ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
                      }`}>
                        {index === 0 ? "Tilt -2°" : "Tilt +2°"}
                      </span>
                    </div>

                    {/* Mentor Image Preview */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
                      {mentor.imageUrl ? (
                        <img
                          src={mentor.imageUrl}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>

                    {/* Mentor Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">
                          {mentor.name}
                        </h4>
                        {mentor.link && (
                          <a
                            href={mentor.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                            title="LinkedIn Profile"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {mentor.role && (
                        <p className="text-xs text-[#ff5e14] font-medium truncate">
                          {mentor.role}
                        </p>
                      )}
                      {mentor.bio && (
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {mentor.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-white disabled:opacity-30"
                      title="Move Up (Left Card)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === mentors.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-white disabled:opacity-30"
                      title="Move Down (Right Card)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(mentor)}
                      className="h-8 text-xs border-zinc-700 text-zinc-300 hover:text-white gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMentor(mentor.id)}
                      className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 p-2"
                      title="Delete Mentor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="border-t border-zinc-800 pt-4">
            <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Mentor Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-lg bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingMentor ? "Edit Sprint Mentor" : "Add Sprint Mentor"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-zinc-400">Mentor Name *</Label>
              <Input
                placeholder="e.g., Alex Rivera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-950 border-zinc-800 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Role / Tagline</Label>
              <Input
                placeholder="e.g., Growth Lead, Ex-Swiggy"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-zinc-950 border-zinc-800 text-sm mt-1"
              />
            </div>

            {/* Mentor Image Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">Mentor Photo (Full Card Image)</Label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
                >
                  {showUrlInput ? "Use File Upload" : "Or enter Image URL"}
                </button>
              </div>

              {formData.imageUrl && (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group flex items-center justify-center">
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
                      className="text-xs"
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
                  className={`border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl p-6 text-center cursor-pointer bg-zinc-950/60 transition ${
                    isUploadingImage ? "opacity-50 pointer-events-none" : ""
                  }`}
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
                      <Loader2 className="w-7 h-7 text-[#ff5e14] animate-spin" />
                      <p className="text-xs text-zinc-400">
                        Uploading photo... {uploadProgress > 0 ? `${uploadProgress}%` : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex flex-col items-center">
                      <UploadCloud className="w-8 h-8 text-zinc-500" />
                      <p className="text-xs font-semibold text-zinc-300">
                        Click to upload mentor photo
                      </p>
                      <p className="text-[11px] text-zinc-500">
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
                    className="bg-zinc-950 border-zinc-800 text-sm"
                  />
                  {formData.imageUrl && (
                    <a
                      href={formData.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-white"
                      title="Open image in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                LinkedIn Profile URL
              </Label>
              <Input
                placeholder="https://www.linkedin.com/in/username"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="bg-zinc-950 border-zinc-800 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Bio (Optional brief intro)</Label>
              <Textarea
                placeholder="Brief summary of mentor's background and achievements..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={2}
                className="bg-zinc-950 border-zinc-800 text-sm mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveMentor}
              disabled={saving || isUploadingImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
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
