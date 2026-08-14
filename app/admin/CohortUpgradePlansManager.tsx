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
  Sparkles,
  Layers,
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

interface CohortUpgradePlansManagerProps {
  cohortId: string;
  cohortTitle: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

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

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formIncludedCount, setFormIncludedCount] = useState("1");
  const [formIncludedSessionIds, setFormIncludedSessionIds] = useState<string[]>([]);
  const [formIsAllInOne, setFormIsAllInOne] = useState(false);
  const [formBadgeText, setFormBadgeText] = useState("");
  const [formFeatures, setFormFeatures] = useState("");
  const [formOrderIndex, setFormOrderIndex] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!cohortId || !open) return;
    try {
      setLoading(true);
      const [plansRes, cohortRes] = await Promise.all([
        axios.get(`/api/admin/cohorts/${cohortId}/upgrade-plans`),
        axios.get(`/api/admin/cohorts/${cohortId}`).catch(() => ({ data: { sessions: [] } })),
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

  const handleOpenAddDialog = () => {
    setEditingPlan(null);
    setFormTitle("");
    setFormDescription("");
    setFormPrice("");
    setFormOriginalPrice("");
    setFormIncludedCount("1");
    setFormIncludedSessionIds([]);
    setFormIsAllInOne(false);
    setFormBadgeText("");
    setFormFeatures("");
    setFormOrderIndex(String(plans.length));
    setFormIsActive(true);
    setEditDialogOpen(true);
  };

  const handleOpenEditDialog = (plan: CohortUpgradePlan) => {
    setEditingPlan(plan);
    setFormTitle(plan.title || "");
    setFormDescription(plan.description || "");
    setFormPrice(String(plan.price));
    setFormOriginalPrice(plan.originalPrice ? String(plan.originalPrice) : "");
    setFormIncludedCount(String(plan.includedSessionCount ?? 1));
    setFormIncludedSessionIds(plan.includedSessionIds || []);
    setFormIsAllInOne(Boolean(plan.isAllInOne));
    setFormBadgeText(plan.badgeText || "");
    setFormFeatures(plan.features ? plan.features.join("\n") : "");
    setFormOrderIndex(String(plan.orderIndex ?? 0));
    setFormIsActive(Boolean(plan.isActive));
    setEditDialogOpen(true);
  };

  const handleInitPresets = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/admin/cohorts/${cohortId}/upgrade-plans`, {
        action: "init_presets",
      });
      toast.success("Standard 4-tier upgrade packages initialized!");
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
    if (!formTitle.trim()) {
      toast.error("Please enter a plan title");
      return;
    }
    const parsedPrice = parseInt(formPrice, 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      price: parsedPrice,
      originalPrice: formOriginalPrice ? parseInt(formOriginalPrice, 10) : null,
      includedSessionCount: formIncludedSessionIds.length > 0
        ? formIncludedSessionIds.length
        : (parseInt(formIncludedCount, 10) || 1),
      includedSessionIds: formIncludedSessionIds,
      isAllInOne: formIsAllInOne,
      badgeText: formBadgeText.trim() || null,
      features: formFeatures
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      orderIndex: parseInt(formOrderIndex, 10) || 0,
      isActive: formIsActive,
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
    if (!confirm(`Are you sure you want to delete upgrade plan "${title}"?`)) return;
    try {
      await axios.delete(`/api/admin/cohorts/${cohortId}/upgrade-plans/${planId}`);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Layers className="h-5 w-5 text-orange-600" />
            Manage Upgrade Packages — {cohortTitle}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Configure upgrade plans shown to users on session pages when they have not purchased specific sessions or full access.
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Active Upgrade Options ({plans.length})
            </h3>
            <div className="flex gap-2">
              {plans.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleInitPresets}
                  className="gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Init Preset Packages
                </Button>
              )}
              <Button size="sm" onClick={handleOpenAddDialog} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Package
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
              <Layers className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="font-semibold text-gray-700 text-sm">
                No Upgrade Packages Configured
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                Users on cohort session pages will see default upgrade options until custom packages are added here.
              </p>
              <Button
                size="sm"
                onClick={handleInitPresets}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Generate Standard 4-Plan Structure
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {plans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    plan.isActive
                      ? "bg-white border-gray-200 shadow-xs hover:border-gray-300"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-400">
                        #{idx + 1}
                      </span>
                      <h4 className="font-bold text-gray-900 text-base">
                        {plan.title}
                      </h4>
                      {plan.badgeText && (
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                          {plan.badgeText}
                        </span>
                      )}
                      {plan.isAllInOne && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          Full Access / All-In-One
                        </span>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {plan.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
                      <span className="font-semibold text-gray-900">
                        ₹{plan.price.toLocaleString("en-IN")}
                        {plan.originalPrice && (
                          <span className="ml-1 line-through text-gray-400 font-normal">
                            ₹{plan.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        {plan.isAllInOne
                          ? "All Sessions Unlocked"
                          : `${plan.includedSessionCount ?? 1} Session${
                              (plan.includedSessionCount ?? 1) > 1 ? "s" : ""
                            }`}
                      </span>
                      {plan.features && plan.features.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{plan.features.length} Features</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-1 mr-2">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => handleToggleActive(plan)}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleOpenEditDialog(plan)}
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
              ))}
            </div>
          )}
        </div>

        {/* Edit / Add Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Edit Upgrade Package" : "Add Upgrade Package"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSavePlan} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Package Title *
                </label>
                <Input
                  placeholder="e.g. 3-Session Skill Pass"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Description
                </label>
                <Input
                  placeholder="e.g. Access 3 live sessions of your choice with Q&A"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Price (₹) *
                  </label>
                  <Input
                    type="number"
                    placeholder="1499"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Original Price (₹ - Strikethrough)
                  </label>
                  <Input
                    type="number"
                    placeholder="2499"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Included Sessions Count
                  </label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={formIncludedCount}
                    onChange={(e) => setFormIncludedCount(e.target.value)}
                    disabled={formIsAllInOne}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Badge Text (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Most Popular, Best Value"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800 block">
                  Package Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormIsAllInOne(false);
                      if (formIncludedCount === "99") setFormIncludedCount("3");
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      !formIsAllInOne
                        ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${!formIsAllInOne ? "bg-orange-600" : "bg-gray-300"}`}></span>
                      Session-Based Package
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      User can select a specific number of sessions (e.g. 3 sessions).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormIsAllInOne(true);
                      setFormIncludedCount("99");
                      setFormIncludedSessionIds([]);
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      formIsAllInOne
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${formIsAllInOne ? "bg-emerald-600" : "bg-gray-300"}`}></span>
                      Full Cohort Pass
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Unlocks ALL live sessions, recordings & resources in cohort.
                    </p>
                  </button>
                </div>
              </div>

              {!formIsAllInOne && cohortSessionsList.length > 0 && (
                <div className="space-y-2 rounded-xl border p-3 bg-gray-50/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800">
                      Select Specific Sessions Included (Optional)
                    </label>
                    <div className="flex gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = cohortSessionsList.map((s) => s.id);
                          setFormIncludedSessionIds(allIds);
                          setFormIncludedCount(String(allIds.length));
                        }}
                        className="text-orange-600 hover:underline font-semibold"
                      >
                        Select All
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormIncludedSessionIds([]);
                          setFormIncludedCount("1");
                        }}
                        className="text-gray-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Pick the exact sessions this package gives access to. If none selected, user can pick any {formIncludedCount} session(s).
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1 pr-1">
                    {cohortSessionsList.map((s, sIdx) => {
                      const isChecked = formIncludedSessionIds.includes(s.id);
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
                              let nextIds: string[];
                              if (e.target.checked) {
                                nextIds = [...formIncludedSessionIds, s.id];
                              } else {
                                nextIds = formIncludedSessionIds.filter(
                                  (id) => id !== s.id
                                );
                              }
                              setFormIncludedSessionIds(nextIds);
                              setFormIncludedCount(
                                String(nextIds.length > 0 ? nextIds.length : 1)
                              );
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span>
                            Session {sIdx + 1}: {s.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Package Features (One per line)
                </label>
                <Textarea
                  placeholder={"Access 3 Live Sessions\nResource & Slide Downloads\nDirect Q&A Access"}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Display Order Index
                  </label>
                  <Input
                    type="number"
                    value={formOrderIndex}
                    onChange={(e) => setFormOrderIndex(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-5">
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                  <span className="text-sm font-medium">Is Active</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editingPlan
                    ? "Save Changes"
                    : "Create Package"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
