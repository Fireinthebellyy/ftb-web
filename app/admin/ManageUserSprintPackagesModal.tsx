"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TargetedPlan {
  id: string;
  title: string;
  description: string | null;
  price: number;
  isAllInOne: boolean | null;
  includedSessionCount: number | null;
  isEnabled: boolean;
}

interface ManageUserSprintPackagesModalProps {
  open: boolean;
  onClose: () => void;
  sprintId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userTierName?: string;
  isBundleUser?: boolean;
}

export default function ManageUserSprintPackagesModal({
  open,
  onClose,
  sprintId,
  userId,
  userName,
  userEmail,
  userTierName,
  isBundleUser,
}: ManageUserSprintPackagesModalProps) {
  const [plans, setPlans] = useState<TargetedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const fetchTargetPlans = useCallback(async () => {
    if (!sprintId || (!userId && !userEmail) || !open) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId: userId || "",
        email: userEmail || "",
      });
      const res = await axios.get(
        `/api/admin/sprints/${sprintId}/user-targets?${params.toString()}`
      );
      setPlans(res.data?.plans || []);
    } catch (err) {
      console.error("Error fetching targeted packages:", err);
      toast.error("Failed to load user package targets");
    } finally {
      setLoading(false);
    }
  }, [sprintId, userId, userEmail, open]);

  useEffect(() => {
    fetchTargetPlans();
  }, [fetchTargetPlans]);

  const handleTogglePlan = async (planId: string, currentEnabled: boolean) => {
    try {
      setTogglingPlanId(planId);
      const nextEnabled = !currentEnabled;

      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, isEnabled: nextEnabled } : p))
      );

      await axios.post(`/api/admin/sprints/${sprintId}/user-targets`, {
        userId,
        userEmail,
        planId,
        isEnabled: nextEnabled,
      });

      toast.success(
        nextEnabled
          ? "Package enabled for user"
          : "Package disabled for user"
      );
    } catch (err) {
      console.error("Error toggling package for user:", err);
      toast.error("Failed to update user package preference");
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, isEnabled: currentEnabled } : p))
      );
    } finally {
      setTogglingPlanId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-100">
            Target Upgrade Packages
          </DialogTitle>
          <div className="text-xs text-zinc-400 mt-1 space-y-0.5">
            <p className="font-semibold text-zinc-200">{userName || "User"}</p>
            <p>{userEmail}</p>
            {userTierName && (
              <p className="text-amber-400 font-medium">
                Current Tier: {userTierName} {isBundleUser ? "(All-in-One)" : ""}
              </p>
            )}
          </div>
        </DialogHeader>

        <div className="py-3 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-400">
              Loading user package targets...
            </div>
          ) : plans.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-lg">
              No upgrade packages created for this sprint.
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between transition-colors",
                  plan.isEnabled
                    ? "bg-zinc-950/60 border-zinc-800"
                    : "bg-zinc-950/20 border-zinc-900 opacity-60"
                )}
              >
                <div className="pr-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-zinc-100">
                      {plan.title}
                    </h4>
                    {plan.isAllInOne && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                        Full Pass
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                      {plan.description}
                    </p>
                  )}
                  <p className="text-xs font-mono text-emerald-400 font-medium mt-1">
                    ₹{plan.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-400">
                    {plan.isEnabled ? "Visible" : "Hidden"}
                  </span>
                  <Switch
                    checked={plan.isEnabled}
                    disabled={togglingPlanId === plan.id}
                    onCheckedChange={() =>
                      handleTogglePlan(plan.id, plan.isEnabled)
                    }
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
