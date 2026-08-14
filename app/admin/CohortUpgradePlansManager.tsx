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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Edit,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export interface CohortUpgradePlan {
  id: string;
  cohortId: string;
  title: string;
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

// Plan type discriminator
type PlanType = "session_based" | "all_in_one" | "custom";

interface CohortUpgradePlansManagerProps {
  cohortId: string;
  cohortTitle: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const EMPTY_FORM = {
  title: "",
  sectionLabel: "",
  description: "",
  price: "",
  originalPrice: "",
  includedCount: "1",
  includedSessionIds: [] as string[],
  planType: "session_based" as PlanType,
  badgeText: "",
  features: "",
  orderIndex: "0",
  isActive: true,
};

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CohortUpgradePlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);

  const setField = <K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const fetchPlans = useCallback(async () => {
    if (!cohortId || !open) return;
    try {
      setLoading(true);
      const [plansRes, cohortRes] = await Promise.all([
        axios.get(`/api/admin/cohorts/${cohortId}/upgrade-plans`),
        axios.get(`/api/admin/cohorts/${cohortId}`).catch(() => ({
          data: { sessions: [] },
        })),
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

  const planTypeFromPlan = (plan: CohortUpgradePlan): PlanType => {
    if (plan.isAllInOne) return "all_in_one";
    if (
      !plan.isAllInOne &&
      plan.includedSessionCount === null &&
      (!plan.includedSessionIds || plan.includedSessionIds.length === 0)
    )
      return "custom";
    return "session_based";
  };

  const openAddDialog = () => {
    setEditingPlan(null);
    setForm({ ...EMPTY_FORM, orderIndex: String(plans.length) });
    setEditDialogOpen(true);
  };

  const openEditDialog = (plan: CohortUpgradePlan) => {
    setEditingPlan(plan);
    setForm({
      title: plan.title || "",
      sectionLabel: (plan as any).sectionLabel || "",
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
    setEditDialogOpen(true);
  };

  const handleInitPresets = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/admin/cohorts/${cohortId}/upgrade-plans`, {
        action: "init_presets",
      });
      toast.success("Standard upgrade packages initialized!");
      fetchPlans();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error setting default upgrade plans:", err);
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
        await axios.post(
          `/api/admin/cohorts/${cohortId}/upgrade-plans`,
          payload
        );
        toast.success("Upgrade plan created!");
      }
      setEditDialogOpen(false);
      fetchPlans();
      if (onUpdate) onUpdate();
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
      if (onUpdate) onUpdate();
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
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error toggling active state:", err);
      toast.error("Failed to update status");
    }
  };

  const PLAN_TYPE_OPTIONS: {
    value: PlanType;
    label: string;
    sublabel: string;
    color: "orange" | "emerald" | "blue";
  }[] = [
    {
      value: "session_based",
      label: "Session-Based Package",
      sublabel:
        "User gets access to a fixed number of cohort sessions (e.g. 3 sessions).",
      color: "orange",
    },
    {
      value: "all_in_one",
      label: "Full Cohort Pass",
      sublabel: "Unlocks ALL live sessions, recordings & resources in the cohort.",
      color: "emerald",
    },
    {
      value: "custom",
      label: "Custom / General Plan",
      sublabel:
        "Any plan not tied to cohort sessions — a product, bootcamp, mentorship, etc.",
      color: "blue",
    },
  ];

  const colorMap = {
    orange: {
      active: "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20",
      dot: "bg-orange-600",
    },
    emerald: {
      active: "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20",
      dot: "bg-emerald-600",
    },
    blue: {
      active: "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20",
      dot: "bg-blue-600",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[96vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Layers className="h-4 w-4 text-orange-600 shrink-0" />
            Manage Upgrade Plans — {cohortTitle}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure plans shown to users when they have limited access. Plans
            can be session-based, full cohort pass, or any custom offering.
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
              <p className="font-semibold text-gray-700 text-sm">
                No Plans Configured
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Add custom plans or initialize with standard presets. Plans
                appear in the upgrade popup on cohort session pages.
              </p>
              <Button
                size="sm"
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
                        <span className="text-xs font-bold text-gray-400">
                          #{idx + 1}
                        </span>
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
                                    (plan.includedSessionCount ?? 1) > 1
                                      ? "s"
                                      : ""
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
                        <span className="text-gray-400">
                          Order: {plan.orderIndex}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <div className="flex items-center gap-1.5 mr-1">
                        <span className="text-xs text-muted-foreground">
                          Active
                        </span>
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

        {/* ── Add / Edit Dialog ─────────────────────────── */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-full max-w-[96vw] sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-5 py-4 border-b shrink-0">
              <DialogTitle className="text-base font-bold">
                {editingPlan ? "Edit Plan" : "Add New Plan"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fill in the fields below. All plans appear in the user-facing upgrade popup.
              </p>
            </DialogHeader>

            <form
              onSubmit={handleSavePlan}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
            >
              {/* ── Plan Type ──────────────────────── */}
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Plan Type *
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PLAN_TYPE_OPTIONS.map((opt) => {
                    const colors = colorMap[opt.color];
                    const isActive = form.planType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setField("planType", opt.value);
                          if (opt.value === "all_in_one") {
                            setField("includedCount", "99");
                            setField("includedSessionIds", []);
                          } else if (opt.value === "custom") {
                            setField("includedCount", "0");
                            setField("includedSessionIds", []);
                          } else {
                            if (form.includedCount === "99" || form.includedCount === "0")
                              setField("includedCount", "3");
                          }
                        }}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isActive ? colors.active : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              isActive ? colors.dot : "bg-gray-300"
                            }`}
                          />
                          {opt.label}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          {opt.sublabel}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* ── Card Header Text ───────────────── */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Card Header
                </legend>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Section Label{" "}
                    <span className="text-gray-400 font-normal">
                      (small orange text above title — e.g. &quot;Package Option&quot;)
                    </span>
                  </label>
                  <Input
                    placeholder="e.g. Package Option, Full Cohort Upgrade, Mentorship Add-on"
                    value={form.sectionLabel}
                    onChange={(e) => setField("sectionLabel", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Plan Title *
                  </label>
                  <Input
                    placeholder="e.g. 3-Session Skill Pass, All-Access Bundle, Mentorship Bootcamp"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Short Description
                  </label>
                  <Input
                    placeholder="e.g. Unlock 3 sessions of your choice with Q&A access"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Badge Text{" "}
                    <span className="text-gray-400 font-normal">
                      (corner ribbon — e.g. &quot;Most Popular&quot;)
                    </span>
                  </label>
                  <Input
                    placeholder="e.g. Most Popular, Best Value, Limited Offer"
                    value={form.badgeText}
                    onChange={(e) => setField("badgeText", e.target.value)}
                  />
                </div>
              </fieldset>

              {/* ── Pricing ────────────────────────── */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Pricing
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Price (₹) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="1499"
                      value={form.price}
                      onChange={(e) => setField("price", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Original Price (₹){" "}
                      <span className="text-gray-400 font-normal">
                        (shown as strikethrough)
                      </span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="2499"
                      value={form.originalPrice}
                      onChange={(e) => setField("originalPrice", e.target.value)}
                    />
                  </div>
                </div>
              </fieldset>

              {/* ── Session Options (session-based only) ─ */}
              {form.planType === "session_based" && (
                <fieldset className="space-y-3">
                  <legend className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Session Access
                  </legend>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Number of Sessions User Can Choose
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="3"
                      value={form.includedCount}
                      onChange={(e) => setField("includedCount", e.target.value)}
                      disabled={form.includedSessionIds.length > 0}
                    />
                    {form.includedSessionIds.length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Count is auto-set to the number of specific sessions selected below.
                      </p>
                    )}
                  </div>

                  {cohortSessionsList.length > 0 && (
                    <div className="space-y-2 rounded-xl border p-3 bg-gray-50/70">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-800">
                          Pin Specific Sessions (Optional)
                        </label>
                        <div className="flex gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              const all = cohortSessionsList.map((s) => s.id);
                              setField("includedSessionIds", all);
                              setField("includedCount", String(all.length));
                            }}
                            className="text-orange-600 hover:underline font-semibold"
                          >
                            All
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setField("includedSessionIds", []);
                              setField("includedCount", "1");
                            }}
                            className="text-gray-500 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        If sessions are pinned, only those are included. Otherwise the user picks any {form.includedCount}.
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-1 pt-1 pr-1">
                        {cohortSessionsList.map((s, sIdx) => {
                          const isChecked = form.includedSessionIds.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className={`flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-orange-50 border-orange-300 font-semibold text-orange-950"
                                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...form.includedSessionIds, s.id]
                                    : form.includedSessionIds.filter(
                                        (id) => id !== s.id
                                      );
                                  setField("includedSessionIds", next);
                                  setField(
                                    "includedCount",
                                    String(next.length > 0 ? next.length : 1)
                                  );
                                }}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              />
                              <span>
                                {sIdx + 1}. {s.title}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </fieldset>
              )}

              {/* ── Features ───────────────────────── */}
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Features List
                </legend>
                <label className="text-xs text-gray-500 block">
                  One feature per line. These appear as bullet points on the plan card.
                </label>
                <Textarea
                  placeholder={
                    form.planType === "custom"
                      ? "Access to Mentorship Portal\n1-on-1 Review Sessions\nCertificate on Completion"
                      : "Access 3 Live Sessions\nResource & Slide Downloads\nDirect Q&A Access"
                  }
                  value={form.features}
                  onChange={(e) => setField("features", e.target.value)}
                  rows={5}
                />
              </fieldset>

              {/* ── Meta ───────────────────────────── */}
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Display Settings
                </legend>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Order Index{" "}
                      <span className="text-gray-400 font-normal">(lower = first)</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.orderIndex}
                      onChange={(e) => setField("orderIndex", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <Switch
                      id="is-active-toggle"
                      checked={form.isActive}
                      onCheckedChange={(v) => setField("isActive", v)}
                    />
                    <label
                      htmlFor="is-active-toggle"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Active (visible to users)
                    </label>
                  </div>
                </div>
              </fieldset>

              {/* ── Actions ────────────────────────── */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editingPlan
                    ? "Save Changes"
                    : "Create Plan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
