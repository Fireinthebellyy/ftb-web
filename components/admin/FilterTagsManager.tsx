"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Edit2, Check, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterTag {
  label: string;
  value: string;
}

const DEFAULT_FILTER_TAGS: FilterTag[] = [
  { label: "College AMAs", value: "college_amas" },
  { label: "Upskill", value: "upskill" },
  { label: "Entrance Exams", value: "entrance_exams" },
];

async function fetchFilterTagsData(): Promise<{
  order: string[];
  labels: Record<string, string>;
}> {
  const response = await axios.get("/api/admin/settings/filter-tags");
  return {
    order: response.data.order || DEFAULT_FILTER_TAGS.map((t) => t.value),
    labels: response.data.labels || {},
  };
}

async function updateFilterTagsData({
  order,
  labels,
}: {
  order: string[];
  labels: Record<string, string>;
}): Promise<void> {
  await axios.put("/api/admin/settings/filter-tags", { order, labels });
}

interface SortableFilterTagProps {
  filterTag: FilterTag;
  customLabel: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (newLabel: string) => void;
  onCancel: () => void;
}

function SortableFilterTag({
  filterTag,
  customLabel,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: SortableFilterTagProps) {
  const [editedLabel, setEditedLabel] = useState(customLabel || filterTag.label);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: filterTag.value });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayLabel = customLabel || filterTag.label;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 transition-all",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      {isEditing ? (
        <div className="flex flex-1 items-center gap-2">
          <Input
            value={editedLabel}
            onChange={(e) => setEditedLabel(e.target.value)}
            className="h-8"
            autoFocus
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onSave(editedLabel)}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span className="font-medium">{displayLabel}</span>
          <span className="text-muted-foreground text-sm">
            ({filterTag.value})
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="ml-auto h-8 w-8"
            onClick={onEdit}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export default function FilterTagsManager() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: { order = DEFAULT_FILTER_TAGS.map((t) => t.value), labels = {} } = {} } = useQuery({
    queryKey: ["admin", "settings", "filter-tags"],
    queryFn: fetchFilterTagsData,
  });

  const [localOrder, setLocalOrder] = useState<string[]>(order);
  const [localLabels, setLocalLabels] = useState<Record<string, string>>(labels);
  const [editingTag, setEditingTag] = useState<string | null>(null);

  // Reset localOrder and localLabels when dialog opens to match current database state
  useEffect(() => {
    if (open) {
      setLocalOrder(order);
      setLocalLabels(labels);
      setEditingTag(null);
    }
  }, [open, order, labels]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateMutation = useMutation({
    mutationFn: updateFilterTagsData,
    onSuccess: () => {
      toast.success("Filter tags updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "settings", "filter-tags"],
      });
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to update filter tags");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localOrder.indexOf(active.id as string);
      const newIndex = localOrder.indexOf(over.id as string);
      setLocalOrder((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ order: localOrder, labels: localLabels });
  };

  const handleEdit = (tagValue: string) => {
    setEditingTag(tagValue);
  };

  const handleSaveLabel = (tagValue: string, newLabel: string) => {
    setLocalLabels((prev) => ({ ...prev, [tagValue]: newLabel }));
    setEditingTag(null);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  const orderedTags = localOrder
    .map((value) => DEFAULT_FILTER_TAGS.find((t) => t.value === value))
    .filter((t): t is FilterTag => t !== undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Filter Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Filter Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Drag to reorder filter tags and click the edit icon to rename them.
            Changes will be reflected across all ungatekeep posts.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {orderedTags.map((filterTag) => (
                  <SortableFilterTag
                    key={filterTag.value}
                    filterTag={filterTag}
                    customLabel={localLabels[filterTag.value] || ""}
                    isEditing={editingTag === filterTag.value}
                    onEdit={() => handleEdit(filterTag.value)}
                    onSave={(newLabel) => handleSaveLabel(filterTag.value, newLabel)}
                    onCancel={handleCancelEdit}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
