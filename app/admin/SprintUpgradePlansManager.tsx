"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, Layers, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  UpgradePlanFormDialog,
  EMPTY_FORM,
  type PlanForm,
  type PlanType,
} from "./UpgradePlanFormDialog";

export interface SprintUpgradePlan {
  id: string;
  sprintId: string;
  title: string;
  sectionLabel: string | null;
  description: string | null;
  price: number;
  originalPrice: number | null;
  includedSessionCount: number | null;
  includedSessionIds: string[] | null;
  isAllInOne: boolean | null;
  badgeText: string | null;
  features: string[] | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

interface SprintUpgradePlansManagerProps {
  sprintId: string;
  sprintTitle: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

function planTypeFromPlan(plan: SprintUpgradePlan): PlanType {
  if (plan.isAllInOne) return "all_in_one";
  if (
    plan.includedSessionCount === null &&
    (!plan.includedSessionIds || plan.includedSessionIds.length === 0)
  )
    return "custom";
  return "session_based";
}

export default function SprintUpgradePlansManager({
  sprintId,
  sprintTitle,
  open,
  onClose,
  onUpdate,
}: SprintUpgradePlansManagerProps) {
  const [plans, setPlans] = useState<SprintUpgradePlan[]>([]);
  const [sprintSessionsList, setSprintSessionsList] = useState<
    { id: string; title: string; orderIndex: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SprintUpgradePlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);

  const setField = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fetchPlans = useCallback(async () => {
    if (!sprintId || !open) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/sprints/${sprintId}/upgrade-plans`);
      setPlans(res.data || []);
    } catch (err) {
      console.error("Error fetching upgrade plans:", err);
      toast.error("Failed to load upgrade plans");
    } finally {
      setLoading(false);
    }
  }, [sprintId, open]);

  const fetchSprintSessions = useCallback(async () => {
    if (!sprintId || !open) return;
    try {
      const res = await axios.get(`/api/admin/sprints/${sprintId}`);
      const sessions = (res.data?.sessions || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        orderIndex: s.orderIndex ?? 0,
      }));
      setSprintSessionsList(sessions);
    } catch (err) {
      console.error("Error fetching sprint sessions list:", err);
    }
  }, [sprintId, open]);

  useEffect(() => {
    fetchPlans();
    fetchSprintSessions();
  }, [fetchPlans, fetchSprintSessions]);

  const handleInitPresets = async () => {
    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `/api/admin/sprints/${sprintId}/upgrade-plans`,
        { action: "init_presets" }
      );
      toast.success("Default upgrade packages initialized");
      setPlans(res.data || []);
      onUpdate?.();
    } catch (err: any) {
      console.error("Error initializing presets:", err);
      toast.error(err.response?.data?.error || "Failed to initialize presets");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (plan: SprintUpgradePlan) => {
    setEditingPlan(plan);
    setForm({
      planType: planTypeFromPlan(plan),
      title: plan.title,
      sectionLabel: plan.sectionLabel || "",
      description: plan.description || "",
      price: plan.price.toString(),
      originalPrice: plan.originalPrice?.toString() || "",
      includedCount: plan.includedSessionCount?.toString() || "1",
      includedSessionIds: plan.includedSessionIds || [],
      badgeText: plan.badgeText || "",
      features: (plan.features || []).join("\n"),
      orderIndex: plan.orderIndex?.toString() || "0",
      isActive: plan.isActive,
    });
    setFormDialogOpen(true);
  };

  const handleToggleActive = async (plan: SprintUpgradePlan) => {
    const nextState = !plan.isActive;
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextState } : p))
    );
    try {
      await axios.put(
        `/api/admin/sprints/${sprintId}/upgrade-plans/${plan.id}`,
        { isActive: nextState }
      );
      toast.success(`Package ${nextState ? "activated" : "deactivated"}`);
      onUpdate?.();
    } catch (err) {
      console.error("Error toggling plan active state:", err);
      toast.error("Failed to update status");
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: plan.isActive } : p))
      );
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this upgrade package?")) return;
    try {
      await axios.delete(
        `/api/admin/sprints/${sprintId}/upgrade-plans/${planId}`
      );
      toast.success("Upgrade package deleted");
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      onUpdate?.();
    } catch (err) {
      console.error("Error deleting upgrade plan:", err);
      toast.error("Failed to delete plan");
    }
  };

  const handleSaveForm = async () => {
    if (!form.title.trim()) {
      toast.error("Package title is required");
      return;
    }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Valid price is required");
      return;
    }

    const isAllInOne = form.planType === "all_in_one";

    const payload = {
      title: form.title.trim(),
      sectionLabel: form.sectionLabel.trim() || null,
      description: form.description.trim() || null,
      price: priceNum,
      originalPrice: form.originalPrice.trim()
        ? parseFloat(form.originalPrice)
        : null,
      includedSessionCount:
        form.planType === "session_based"
          ? parseInt(form.includedCount) || 1
          : null,
      includedSessionIds:
        form.planType === "session_based" ? form.includedSessionIds : [],
      isAllInOne,
      badgeText: form.badgeText.trim() || null,
      features: form.features
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };

    try {
      setIsSubmitting(true);
      if (editingPlan) {
        const res = await axios.put(
          `/api/admin/sprints/${sprintId}/upgrade-plans/${editingPlan.id}`,
          payload
        );
        setPlans((prev) =>
          prev.map((p) => (p.id === editingPlan.id ? res.data : p))
        );
        toast.success("Upgrade package updated");
      } else {
        const res = await axios.post(
          `/api/admin/sprints/${sprintId}/upgrade-plans`,
          payload
        );
        setPlans((prev) => [...prev, res.data]);
        toast.success("Upgrade package created");
      }
      setFormDialogOpen(false);
      onUpdate?.();
    } catch (err: any) {
      console.error("Error saving upgrade plan:", err);
      toast.error(err.response?.data?.error || "Failed to save package");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  Upgrade Packages — {sprintTitle}
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage add-on passes, bundles, and full-access plans for sprint students.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {plans.length === 0 && !loading && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleInitPresets}
                    disabled={isSubmitting}
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                    Load Presets
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleOpenAdd}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Package
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 bg-zinc-800 rounded-lg" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-lg">
                <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-300">
                  No upgrade packages found
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Click &ldquo;Load Presets&rdquo; to populate standard packages or create a custom upgrade plan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "p-4 rounded-xl border flex flex-col justify-between transition-colors bg-zinc-950/80 border-zinc-800",
                      !plan.isActive && "opacity-60"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {plan.badgeText && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded inline-block mb-1">
                              {plan.badgeText}
                            </span>
                          )}
                          <h4 className="text-base font-bold text-white leading-tight">
                            {plan.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(plan)}
                            className="h-7 w-7 text-zinc-400 hover:text-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="h-7 w-7 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {plan.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {plan.description}
                        </p>
                      )}

                      <div className="pt-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-emerald-400">
                          ₹{plan.price.toLocaleString("en-IN")}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-xs text-zinc-500 line-through">
                            ₹{plan.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/60 mt-3 flex items-center justify-between text-xs text-zinc-400">
                      <span>{plan.isActive ? "Active" : "Disabled"}</span>
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => handleToggleActive(plan)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UpgradePlanFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        isEditing={Boolean(editingPlan)}
        form={form}
        setField={setField}
        isSubmitting={isSubmitting}
        cohortSessionsList={sprintSessionsList}
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveForm();
        }}
      />
    </>
  );
}
