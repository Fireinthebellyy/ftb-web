"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PopupFormModal from "./PopupFormModal";
import { Pencil, Trash2 } from "lucide-react";

type Popup = {
  id: string;
  title: string;
  type: "text" | "image";
  content: string | null;
  images: string[];
  delaySeconds: number;
  isActive: boolean;
  createdAt: string;
};

export default function AdminPopupsTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: async () => {
      const res = await fetch("/api/admin/popups");
      if (!res.ok) throw new Error("Failed to fetch popups");
      return res.json() as Promise<{ popups: Popup[] }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/popups/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Popup deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
    },
    onError: () => {
      toast.error("Failed to delete popup");
    },
  });

  const popups = data?.popups || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingPopup(null);
            setIsModalOpen(true);
          }}
        >
          Create Popup
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Delay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-red-500">
                  Failed to load popups.{" "}
                  <button onClick={() => refetch()} className="underline font-medium hover:text-red-700">
                    Retry
                  </button>
                </TableCell>
              </TableRow>
            ) : popups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No popups found.
                </TableCell>
              </TableRow>
            ) : (
              popups.map((popup) => (
                <TableRow key={popup.id}>
                  <TableCell className="font-medium">{popup.title}</TableCell>
                  <TableCell className="capitalize">{popup.type}</TableCell>
                  <TableCell>{popup.delaySeconds}s</TableCell>
                  <TableCell>
                    <Badge variant={popup.isActive ? "default" : "secondary"}>
                      {popup.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPopup(popup);
                          setIsModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this popup?"
                            )
                          ) {
                            deleteMutation.mutate(popup.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PopupFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPopup(null);
        }}
        popupToEdit={editingPopup}
      />
    </div>
  );
}
