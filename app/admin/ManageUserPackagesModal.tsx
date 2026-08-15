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

interface TargetedPlan {
  id: string;
  title: string;
  description: string | null;
  price: number;
  isAllInOne: boolean | null;
  includedSessionCount: number | null;
  isEnabled: boolean;
}

interface ManageUserPackagesModalProps {
  open: boolean;
  onClose: () => void;
  cohortId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userTierName?: string;
  isBundleUser?: boolean;
}

export default function ManageUserPackagesModal({
  open,
  onClose,
  cohortId,
  userId,
  userName,
  userEmail,
  userTierName,
  isBundleUser,
}: ManageUserPackagesModalProps) {
  const [plans, setPlans] = useState<TargetedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const fetchTargetPlans = useCallback(async () => {
    if (!cohortId || (!userId && !userEmail) || !open) {
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
        `/api/admin/cohorts/${cohortId}/user-targets?${params.toString()}`
      );
      setPlans(res.data?.plans || []);
    } catch (err) {
      console.error("Error fetching targeted packages:", err);
      toast.error("Failed to load user package targets");
    } finally {
      setLoading(false);
    }
  }, [cohortId, userId, userEmail, open]);

  useEffect(() => {
    fetchTargetPlans();
  }, [fetchTargetPlans]);

  const handleTogglePlan = async (planId: string, currentEnabled: boolean) => {
    try {
      setTogglingPlanId(planId);
      const nextEnabled = !currentEnabled;

      // Optimistic update
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, isEnabled: nextEnabled } : p))
      );

      await axios.post(`/api/admin/cohorts/${cohortId}/user-targets`, {
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
      console.error("Error toggling package target:", err);
      toast.error("Failed to update package status");
      // Revert optimism
      fetchTargetPlans();
    } finally {
      setTogglingPlanId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold text-gray-900">
            Manage Packages for {userName || "Registrant"}
          </DialogTitle>
          <div className="text-xs text-gray-500 space-y-0.5 mt-1">
            <p>Email: {userEmail}</p>
            <p>
              Current Membership:{" "}
              <span className="font-semibold text-gray-800">
                {isBundleUser || userTierName
                  ? `${userTierName || "All-In-One Bundle"}`
                  : "Select Package"}
              </span>
            </p>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border">
            Toggle which upgrade packages are visible and targeted for this registrant.
            Turning a package ON makes it available for them to view and purchase as an upgrade.
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500">
              Loading packages...
            </div>
          ) : plans.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 border border-dashed rounded-lg">
              No active upgrade packages configured for this cohort yet. Go to Cohorts list &gt; Upgrade Plans to create package options.
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    plan.isEnabled
                      ? "bg-white border-gray-300 shadow-xs"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="space-y-1 max-w-[340px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {plan.title}
                      </span>
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        ₹{plan.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {plan.isAllInOne
                        ? "Full Cohort / All-In-One Pass"
                        : `${plan.includedSessionCount ?? 1} Sessions Included`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-600">
                      {plan.isEnabled ? "Available" : "Hidden"}
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
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
