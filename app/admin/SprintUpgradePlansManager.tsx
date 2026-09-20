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
        <DialogContent className="w-full max-w-[96vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white text-gray-900 border border-gray-200 shadow-xl rounded-2xl">
          <DialogHeader className="px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6 sm:pr-8">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-600 shrink-0" />
                  Upgrade Packages — {sprintTitle}
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage add-on passes, bundles, and full-access plans for sprint students.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {plans.length === 0 && !loading && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleInitPresets}
                    disabled={isSubmitting}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 text-xs font-semibold"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 mr-1 text-orange-600" />
                    Load Presets
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleOpenAdd}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Package
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/40">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-36 bg-gray-200/70 rounded-xl" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center bg-white shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-3 text-orange-600">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No upgrade packages found</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Click &ldquo;Load Presets&rdquo; to populate standard sprint passes or create a custom upgrade plan.
                </p>
                <div className="mt-5 flex items-center justify-center gap-2.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleInitPresets}
                    disabled={isSubmitting}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 mr-1 text-gray-500" />
                    Initialize Presets
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleOpenAdd}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1"
                  >
                    <Plus className="w-4 h-4" /> Create Custom Plan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan, idx) => {
                  const pType = planTypeFromPlan(plan);
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "p-4 sm:p-5 rounded-xl border flex flex-col justify-between transition-all duration-200 shadow-xs",
                        plan.isActive
                          ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          : "bg-gray-50/80 border-gray-200 opacity-65"
                      )}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold font-mono text-gray-400">
                                #{idx + 1}
                              </span>
                              {plan.badgeText && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full inline-block">
                                  {plan.badgeText}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0 border",
                                  pType === "all_in_one"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                    : pType === "custom"
                                    ? "bg-blue-50 text-blue-700 border-blue-200/60"
                                    : "bg-orange-50 text-orange-700 border-orange-200/60"
                                )}
                              >
                                {pType === "all_in_one"
                                  ? "Full Pass"
                                  : pType === "custom"
                                  ? "Custom"
                                  : "Session-Based"}
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug truncate">
                              {plan.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenEdit(plan)}
                              className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                              title="Edit package"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeletePlan(plan.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Delete package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {plan.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {plan.description}
                          </p>
                        )}

                        <div className="pt-1 flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-extrabold text-gray-900">
                            ₹{plan.price.toLocaleString("en-IN")}
                          </span>
                          {plan.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{plan.originalPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>

                        {plan.features && plan.features.length > 0 && (
                          <div className="pt-1 flex items-center gap-2 text-[11px] text-gray-500">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{plan.features.length} features included</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 mt-3.5 flex items-center justify-between text-xs text-gray-600">
                        <span className="font-medium flex items-center gap-1.5">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              plan.isActive ? "bg-emerald-500" : "bg-gray-300"
                            )}
                          />
                          {plan.isActive ? "Active on Checkout" : "Disabled (Draft)"}
                        </span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.isActive}
                            onCheckedChange={() => handleToggleActive(plan)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-white text-xs"
            >
              Close
            </Button>
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
