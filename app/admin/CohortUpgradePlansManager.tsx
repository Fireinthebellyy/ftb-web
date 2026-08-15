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
import {
  UpgradePlanFormDialog,
  EMPTY_FORM,
  type PlanForm,
  type PlanType,
} from "./UpgradePlanFormDialog";

// ── Types ────────────────────────────────────────────────────────
export interface CohortUpgradePlan {
  id: string;
  cohortId: string;
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

interface CohortUpgradePlansManagerProps {
  cohortId: string;
  cohortTitle: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────
function planTypeFromPlan(plan: CohortUpgradePlan): PlanType {
  if (plan.isAllInOne) return "all_in_one";
  if (
    plan.includedSessionCount === null &&
    (!plan.includedSessionIds || plan.includedSessionIds.length === 0)
  )
    return "custom";
  return "session_based";
}

// ── Component ────────────────────────────────────────────────────
export default function CohortUpgradePlansManager({
  cohortId,
  cohortTitle,
  open,
  onClose,
  onUpdate,
}: CohortUpgradePlansManagerProps) {
  const [plans, setPlans] = useState<CohortUpgradePlan[]>([]);
  const [cohortSessionsList, setCohortSessionsList] = useState<
    { id: string; title: string; orderIndex: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CohortUpgradePlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);

  const setField = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Data fetching ────────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    if (!cohortId || !open) return;
    try {
      setLoading(true);
      const [plansRes, cohortRes] = await Promise.all([
        axios.get(`/api/admin/cohorts/${cohortId}/upgrade-plans`),
        axios
          .get(`/api/admin/cohorts/${cohortId}`)
          .catch(() => ({ data: { sessions: [] } })),
      ]);
      setPlans(plansRes.data || []);
      setCohortSessionsList(cohortRes.data?.sessions || []);
    } catch (err) {
      console.error("Error fetching upgrade plans:", err);
      toast.error("Failed to load upgrade plans");
    } finally {
      setLoading(false);
    }
  }, [cohortId, open]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ── Dialog open helpers ──────────────────────────────────────
  const openAddDialog = () => {
    setEditingPlan(null);
    setForm({ ...EMPTY_FORM, orderIndex: String(plans.length) });
    setFormDialogOpen(true);
  };

  const openEditDialog = (plan: CohortUpgradePlan) => {
    setEditingPlan(plan);
    setForm({
      title: plan.title || "",
      sectionLabel: plan.sectionLabel || "",
      description: plan.description || "",
      price: String(plan.price),
      originalPrice: plan.originalPrice ? String(plan.originalPrice) : "",
      includedCount: String(plan.includedSessionCount ?? 1),
      includedSessionIds: plan.includedSessionIds || [],
      planType: planTypeFromPlan(plan),
      badgeText: plan.badgeText || "",
      features: plan.features ? plan.features.join("\n") : "",
      orderIndex: String(plan.orderIndex ?? 0),
      isActive: Boolean(plan.isActive),
    });
    setFormDialogOpen(true);
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleInitPresets = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/admin/cohorts/${cohortId}/upgrade-plans`, {
        action: "init_presets",
      });
      toast.success("Standard upgrade packages initialized!");
      fetchPlans();
      onUpdate?.();
    } catch (err) {
      console.error("Error initializing presets:", err);
      toast.error("Failed to initialize default plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a plan title");
      return;
    }
    const parsedPrice = parseInt(form.price, 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price (0 for free)");
      return;
    }

    const isAllInOne = form.planType === "all_in_one";
    const isCustom = form.planType === "custom";

    const payload = {
      title: form.title.trim(),
      sectionLabel: form.sectionLabel.trim() || null,
      description: form.description.trim() || null,
      price: parsedPrice,
      originalPrice: form.originalPrice ? parseInt(form.originalPrice, 10) : null,
      includedSessionCount: isAllInOne
        ? 99
        : isCustom
        ? null
        : form.includedSessionIds.length > 0
        ? form.includedSessionIds.length
        : parseInt(form.includedCount, 10) || 1,
      includedSessionIds: isAllInOne || isCustom ? [] : form.includedSessionIds,
      isAllInOne,
      badgeText: form.badgeText.trim() || null,
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      orderIndex: parseInt(form.orderIndex, 10) || 0,
      isActive: form.isActive,
    };

    try {
      setIsSubmitting(true);
      if (editingPlan) {
        await axios.put(
          `/api/admin/cohorts/${cohortId}/upgrade-plans/${editingPlan.id}`,
          payload
        );
        toast.success("Upgrade plan updated!");
      } else {
        await axios.post(`/api/admin/cohorts/${cohortId}/upgrade-plans`, payload);
        toast.success("Upgrade plan created!");
      }
      setFormDialogOpen(false);
      fetchPlans();
      onUpdate?.();
    } catch (err) {
      console.error("Error saving upgrade plan:", err);
      toast.error("Failed to save upgrade plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string, title: string) => {
    if (!confirm(`Delete upgrade plan "${title}"?`)) return;
    try {
      await axios.delete(
        `/api/admin/cohorts/${cohortId}/upgrade-plans/${planId}`
      );
      toast.success("Upgrade plan deleted");
      fetchPlans();
      onUpdate?.();
    } catch (err) {
      console.error("Error deleting plan:", err);
      toast.error("Failed to delete plan");
    }
  };

  const handleToggleActive = async (plan: CohortUpgradePlan) => {
    try {
      await axios.put(
        `/api/admin/cohorts/${cohortId}/upgrade-plans/${plan.id}`,
        { isActive: !plan.isActive }
      );
      toast.success(`Plan ${!plan.isActive ? "activated" : "deactivated"}`);
      fetchPlans();
      onUpdate?.();
    } catch (err) {
      console.error("Error toggling active state:", err);
      toast.error("Failed to update status");
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-[96vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Layers className="h-4 w-4 text-orange-600 shrink-0" />
              Manage Upgrade Plans — {cohortTitle}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure plans shown to users when they have limited access. Plans
              can be session-based, a full cohort pass, or any custom offering.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                Plans ({plans.length})
              </h3>
              <div className="flex gap-2">
                {plans.length === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={handleInitPresets}
                    className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Init Presets
                  </Button>
                )}
                <Button size="sm" onClick={openAddDialog} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Add Plan
                </Button>
              </div>
            </div>

            {/* Plan list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
                <Layers className="mx-auto h-7 w-7 text-gray-400 mb-2" />
                <p className="font-semibold text-gray-700 text-sm">No Plans Configured</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                  Add custom plans or initialize with standard presets. Plans
                  appear in the upgrade popup on cohort session pages.
                </p>
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={handleInitPresets}
                  className="bg-orange-600 hover:bg-orange-700 text-xs gap-1.5"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Generate Standard Plans
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {plans.map((plan, idx) => {
                  const pType = planTypeFromPlan(plan);
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        plan.isActive
                          ? "bg-white border-gray-200 shadow-xs hover:border-gray-300"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {plan.title}
                          </h4>
                          {plan.badgeText && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 shrink-0">
                              {plan.badgeText}
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              pType === "all_in_one"
                                ? "bg-emerald-100 text-emerald-800"
                                : pType === "custom"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {pType === "all_in_one"
                              ? "Full Pass"
                              : pType === "custom"
                              ? "Custom"
                              : "Session-Based"}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {plan.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-600 pt-0.5 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            ₹{plan.price.toLocaleString("en-IN")}
                            {plan.originalPrice && (
                              <span className="ml-1 line-through text-gray-400 font-normal">
                                ₹{plan.originalPrice.toLocaleString("en-IN")}
                              </span>
                            )}
                          </span>
                          {pType !== "custom" && (
                            <>
                              <span>•</span>
                              <span>
                                {plan.isAllInOne
                                  ? "All Sessions"
                                  : `${plan.includedSessionCount ?? 1} Session${
                                      (plan.includedSessionCount ?? 1) > 1 ? "s" : ""
                                    }`}
                              </span>
                            </>
                          )}
                          {plan.features && plan.features.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{plan.features.length} features</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-gray-400">Order: {plan.orderIndex}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <div className="flex items-center gap-1.5 mr-1">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch
                            checked={plan.isActive}
                            onCheckedChange={() => handleToggleActive(plan)}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEditDialog(plan)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeletePlan(plan.id, plan.title)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Form Dialog (extracted to keep file under lint line limit) */}
      <UpgradePlanFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        isEditing={Boolean(editingPlan)}
        isSubmitting={isSubmitting}
        form={form}
        setField={setField}
        cohortSessionsList={cohortSessionsList}
        onSubmit={handleSavePlan}
      />
    </>
  );
}
