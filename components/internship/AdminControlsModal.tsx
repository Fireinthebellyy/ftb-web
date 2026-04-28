"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { InternshipData } from "@/types/interfaces";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminControlsModalProps {
  internship: InternshipData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updatedInternship: InternshipData) => void;
  onDeleted?: () => void;
}

export const AdminControlsModal: React.FC<AdminControlsModalProps> = ({
  internship,
  open,
  onOpenChange,
  onUpdate,
  onDeleted,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State for editable fields
  const [displayIndex, setDisplayIndex] = useState<number>(
    internship?.display_index ?? 0
  );
  const [trendingIndex, setTrendingIndex] = useState<number>(
    internship?.trending_index ?? 0
  );
  const [featuredIndex, setFeaturedIndex] = useState<number>(
    internship?.featured_home_index ?? 0
  );
  const [isTrending, setIsTrending] = useState<boolean>(
    internship?.is_trending ?? false
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(
    internship?.is_featured_home ?? false
  );
  const [isActive, setIsActive] = useState<boolean>(
    internship?.isActive ?? true
  );

  // Sync state when internship changes
  React.useEffect(() => {
    if (internship) {
      setDisplayIndex(internship.display_index ?? 0);
      setTrendingIndex(internship.trending_index ?? 0);
      setFeaturedIndex(internship.featured_home_index ?? 0);
      setIsTrending(internship.is_trending ?? false);
      setIsFeatured(internship.is_featured_home ?? false);
      setIsActive(internship.isActive ?? true);
    }
  }, [internship, open]);

  const handleSaveChanges = async () => {
    if (!internship?.id) return;

    setIsUpdating(true);
    try {
      const payload: Record<string, unknown> = {
        display_index: displayIndex,
        trending_index: trendingIndex,
        featured_home_index: featuredIndex,
        isTrending,
        isFeaturedHome: isFeatured,
        isActive,
      };

      const response = await fetch(`/api/internships/${internship.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update internship");
      }

      onUpdate(data.internship as InternshipData);
      toast.success("Internship updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating internship:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update internship"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!internship?.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/internships/${internship.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete internship");
      }

      toast.success("Internship deleted successfully");
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      console.error("Error deleting internship:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete internship"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!internship) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Controls</DialogTitle>
            <DialogDescription>
              {internship.title} • {internship.hiringOrganization}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="visibility" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
              <TabsTrigger value="ordering">Ordering</TabsTrigger>
              <TabsTrigger value="danger">Danger</TabsTrigger>
            </TabsList>

            {/* Visibility Tab */}
            <TabsContent value="visibility" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Active</Label>
                    <p className="text-sm text-slate-500">
                      Show this internship on the platform
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Trending</Label>
                    <p className="text-sm text-slate-500">
                      Mark as trending to highlight it
                    </p>
                  </div>
                  <Switch
                    checked={isTrending}
                    onCheckedChange={setIsTrending}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">
                      Featured Home
                    </Label>
                    <p className="text-sm text-slate-500">
                      Show on homepage featured section
                    </p>
                  </div>
                  <Switch
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Ordering Tab */}
            <TabsContent value="ordering" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="display-index" className="text-base font-semibold">
                    Display Index
                  </Label>
                  <p className="text-sm text-slate-500 mb-2">
                    Controls the general ordering. Lower numbers appear first.
                  </p>
                  <Input
                    id="display-index"
                    type="number"
                    value={displayIndex}
                    onChange={(e) => setDisplayIndex(Number(e.target.value))}
                    disabled={isUpdating}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="trending-index" className="text-base font-semibold">
                    Trending Index
                  </Label>
                  <p className="text-sm text-slate-500 mb-2">
                    Controls trending section ordering. Lower numbers appear first.
                  </p>
                  <Input
                    id="trending-index"
                    type="number"
                    value={trendingIndex}
                    onChange={(e) => setTrendingIndex(Number(e.target.value))}
                    disabled={isUpdating}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="featured-index" className="text-base font-semibold">
                    Featured Home Index
                  </Label>
                  <p className="text-sm text-slate-500 mb-2">
                    Controls featured section ordering. Lower numbers appear first.
                  </p>
                  <Input
                    id="featured-index"
                    type="number"
                    value={featuredIndex}
                    onChange={(e) => setFeaturedIndex(Number(e.target.value))}
                    disabled={isUpdating}
                    className="bg-white"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Danger Tab */}
            <TabsContent value="danger" className="space-y-6">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-900 mb-2">
                  Delete Internship
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  This action cannot be undone. The internship will be permanently
                  deleted from the system.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isUpdating || isDeleting}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Internship
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={isUpdating}
              className="bg-[#ec5b13] hover:bg-[#d44d0c]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Internship?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{internship.title}&quot; from{" "}
              {internship.hiringOrganization}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
