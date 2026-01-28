"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import NewInternshipForm from "./NewInternshipForm";

export default function NewInternshipButton() {
  const [open, setOpen] = useState(false);

  const handleInternshipCreated = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Internship
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Internship</DialogTitle>
        </DialogHeader>
        <NewInternshipForm
          onInternshipCreated={handleInternshipCreated}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
