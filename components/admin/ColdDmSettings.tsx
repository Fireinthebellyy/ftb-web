"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

async function fetchColdDmSettings() {
  const response = await axios.get("/api/admin/settings/cold-dm");
  return response.data;
}

export function ColdDmSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "cold-dm-settings"],
    queryFn: fetchColdDmSettings,
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: {
      coldDmShowPageBanner: boolean;
      coldDmShowTemplates: boolean;
    }) => {
      const response = await axios.patch("/api/admin/settings/cold-dm", newSettings);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Cold DM settings updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "cold-dm-settings"] });
    },
    onError: () => {
      toast.error("Failed to update Cold DM settings");
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Cold DM Settings</h2>
        <p className="text-slate-600">
          Configure what content appears in the Cold DM popup
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showPageBanner" className="text-base font-semibold">
              Show Page Banner
            </Label>
            <p className="text-sm text-slate-500">
              Display Sanity CMS banners in Cold DM popup
            </p>
          </div>
          <Switch
            id="showPageBanner"
            checked={settings?.coldDmShowPageBanner ?? true}
            onCheckedChange={(checked) =>
              updateMutation.mutate({
                coldDmShowPageBanner: checked,
                coldDmShowTemplates: settings?.coldDmShowTemplates ?? true,
              })
          }
            disabled={updateMutation.isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showTemplates" className="text-base font-semibold">
              Show Templates
            </Label>
            <p className="text-sm text-slate-500">
              Display Cold DM templates in popup
            </p>
          </div>
          <Switch
            id="showTemplates"
            checked={settings?.coldDmShowTemplates ?? true}
            onCheckedChange={(checked) =>
              updateMutation.mutate({
                coldDmShowPageBanner: settings?.coldDmShowPageBanner ?? true,
                coldDmShowTemplates: checked,
              })
          }
            disabled={updateMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
