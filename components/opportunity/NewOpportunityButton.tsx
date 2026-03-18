"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import NewOpportunityForm from "@/components/opportunity/NewOpportunityForm";
import { memo } from "react";

interface NewOpportunityButtonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  layout: "horizontal" | "vertical";
}

const NewOpportunityButton = memo(function NewOpportunityButton({
  isOpen,
  onOpenChange,
  layout,
}: NewOpportunityButtonProps) {
  const layoutClasses =
    layout === "horizontal"
      ? "flex items-center justify-between"
      : "flex flex-col items-center gap-2";

  return (
    <div
      className={`mb-4 w-full rounded-lg border bg-white px-4 py-3 ${layoutClasses}`}
    >
      <p className="font-medium">Have a new opportunity?</p>
      <Button
        className="w-full sm:w-auto"
        variant="default"
        onClick={() => onOpenChange(true)}
      >
        Post it here
      </Button>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="mx-auto [-ms-overflow-style:none] [scrollbar-width:none] md:max-h-[600px] md:min-w-[600px] [&::-webkit-scrollbar]:hidden"
          overlayClassName="backdrop-blur-xs bg-black/30"
        >
          <NewOpportunityForm
            onOpportunityCreated={() => {
              onOpenChange(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
});

export { NewOpportunityButton };
