import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit2, Loader2 } from "lucide-react";

export default function ToolkitTabsEditDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const [localTabs, setLocalTabs] = useState({
    toolkitCohortsTabLabel: "Live Cohorts",
    toolkitSessionsTabLabel: "Sessions",
    toolkitMentorshipTabLabel: "1:1 Mentorship",
    toolkitDigitalProductsTabLabel: "Digital products",
  });

  const { data: tabsSettings, isLoading } = useQuery({
    queryKey: ["admin", "settings", "toolkit-tabs"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/settings/toolkit-tabs");
      return res.data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (tabsSettings) {
      setLocalTabs({
        toolkitCohortsTabLabel: tabsSettings.toolkitCohortsTabLabel ?? "Live Cohorts",
        toolkitSessionsTabLabel: tabsSettings.toolkitSessionsTabLabel ?? "Sessions",
        toolkitMentorshipTabLabel: tabsSettings.toolkitMentorshipTabLabel ?? "1:1 Mentorship",
        toolkitDigitalProductsTabLabel: tabsSettings.toolkitDigitalProductsTabLabel ?? "Digital products",
      });
    }
  }, [tabsSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: typeof localTabs) => {
      await axios.patch("/api/admin/settings/toolkit-tabs", payload);
    },
    onSuccess: () => {
      toast.success("Toolkit category labels updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "toolkit-tabs"] });
      setIsOpen(false);
    },
    onError: () => {
      toast.error("Failed to update labels");
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(localTabs);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white">
          <Edit2 className="h-4 w-4" />
          Edit Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Toolkit Categories</DialogTitle>
          <DialogDescription>
            Change the display names of the toolkit categories shown on the main toolkits page.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cohorts">Cohorts Tab</Label>
              <Input
                id="cohorts"
                value={localTabs.toolkitCohortsTabLabel}
                onChange={(e) =>
                  setLocalTabs({ ...localTabs, toolkitCohortsTabLabel: e.target.value })
                }
                placeholder="e.g. Live Cohorts"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sessions">Sessions Tab</Label>
              <Input
                id="sessions"
                value={localTabs.toolkitSessionsTabLabel}
                onChange={(e) =>
                  setLocalTabs({ ...localTabs, toolkitSessionsTabLabel: e.target.value })
                }
                placeholder="e.g. Sessions"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mentorship">Mentorship Tab</Label>
              <Input
                id="mentorship"
                value={localTabs.toolkitMentorshipTabLabel}
                onChange={(e) =>
                  setLocalTabs({ ...localTabs, toolkitMentorshipTabLabel: e.target.value })
                }
                placeholder="e.g. 1:1 Mentorship"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="digital">Digital Products Tab</Label>
              <Input
                id="digital"
                value={localTabs.toolkitDigitalProductsTabLabel}
                onChange={(e) =>
                  setLocalTabs({ ...localTabs, toolkitDigitalProductsTabLabel: e.target.value })
                }
                placeholder="e.g. Digital products"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending || isLoading}
          >
            {updateSettingsMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
