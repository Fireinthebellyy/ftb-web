"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { DigitalProductSection } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

async function fetchSections(): Promise<DigitalProductSection[]> {
  const response = await axios.get<DigitalProductSection[]>(
    "/api/admin/digital-products/sections"
  );
  return response.data;
}

export default function AdminDigitalProductsSettings() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);

  const { data: sections = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "digital-product-sections"],
    queryFn: fetchSections,
  });

  const createSectionMutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/admin/digital-products/sections", {
        title,
        description,
        orderIndex,
        isActive: true,
      });
    },
    onSuccess: () => {
      toast.success("Digital product section created");
      setTitle("");
      setDescription("");
      setOrderIndex(0);
      queryClient.invalidateQueries({
        queryKey: ["admin", "digital-product-sections"],
      });
    },
    onError: () => toast.error("Failed to create section"),
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<DigitalProductSection>;
    }) => {
      await axios.put(`/api/admin/digital-products/sections/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "digital-product-sections"],
      });
    },
    onError: () => toast.error("Failed to update section"),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/digital-products/sections/${id}`);
    },
    onSuccess: () => {
      toast.success("Digital product section deleted");
      queryClient.invalidateQueries({
        queryKey: ["admin", "digital-product-sections"],
      });
    },
    onError: () => toast.error("Failed to delete section"),
  });

  return (
    <AdminTabLayout
      title="Digital Products"
      description="Create and manage sections available for digital product toolkits"
      stats={
        <p className="text-muted-foreground text-sm">
          Total sections:{" "}
          <span className="text-foreground font-medium">{sections.length}</span>
        </p>
      }
    >
      <div className="space-y-4">
        <form
          className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_1fr_120px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) {
              toast.error("Section title is required");
              return;
            }
            createSectionMutation.mutate();
          }}
        >
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Section title"
          />
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short description"
            className="min-h-10"
          />
          <Input
            type="number"
            value={orderIndex}
            onChange={(event) => setOrderIndex(Number(event.target.value) || 0)}
            placeholder="Order"
          />
          <Button type="submit" disabled={createSectionMutation.isPending}>
            {createSectionMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            Add section
          </Button>
        </form>

        {isLoading ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-neutral-500">
            Loading sections...
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Failed to load digital product sections.
          </div>
        ) : null}

        {!isLoading && !sections.length ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-neutral-500">
            No sections yet. Add one above to make it selectable in toolkits.
          </div>
        ) : null}

        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_1fr_100px_90px_auto]"
            >
              <Input
                defaultValue={section.title}
                onBlur={(event) => {
                  const nextTitle = event.target.value.trim();
                  if (nextTitle && nextTitle !== section.title) {
                    updateSectionMutation.mutate({
                      id: section.id,
                      payload: { title: nextTitle },
                    });
                  }
                }}
              />
              <Textarea
                defaultValue={section.description ?? ""}
                className="min-h-10"
                onBlur={(event) => {
                  const nextDescription = event.target.value.trim();
                  if (nextDescription !== (section.description ?? "")) {
                    updateSectionMutation.mutate({
                      id: section.id,
                      payload: { description: nextDescription },
                    });
                  }
                }}
              />
              <Input
                type="number"
                defaultValue={section.orderIndex}
                onBlur={(event) => {
                  const nextOrderIndex = Number(event.target.value) || 0;
                  if (nextOrderIndex !== section.orderIndex) {
                    updateSectionMutation.mutate({
                      id: section.id,
                      payload: { orderIndex: nextOrderIndex },
                    });
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={section.isActive}
                  onCheckedChange={(isActive) =>
                    updateSectionMutation.mutate({
                      id: section.id,
                      payload: { isActive },
                    })
                  }
                />
                <span className="text-sm">
                  {section.isActive ? "Active" : "Hidden"}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!confirm(`Delete "${section.title}"?`)) return;
                  deleteSectionMutation.mutate(section.id);
                }}
                title="Delete section"
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AdminTabLayout>
  );
}
