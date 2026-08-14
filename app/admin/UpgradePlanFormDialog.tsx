"use client";

import React from "react";
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

// ── Types ────────────────────────────────────────────────────────
export type PlanType = "session_based" | "all_in_one" | "custom";

export const EMPTY_FORM = {
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

export type PlanForm = typeof EMPTY_FORM;

interface CohortSession {
  id: string;
  title: string;
  orderIndex: number;
}

interface UpgradePlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  form: PlanForm;
  setField: <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => void;
  cohortSessionsList: CohortSession[];
  onSubmit: (e: React.FormEvent) => void;
}

const PLAN_TYPE_OPTIONS: {
  value: PlanType;
  label: string;
  sublabel: string;
  color: "orange" | "emerald" | "blue";
}[] = [
  {
    value: "session_based",
    label: "Session-Based Package",
    sublabel: "User gets access to a fixed number of cohort sessions (e.g. 3 sessions).",
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
    sublabel: "Any plan not tied to cohort sessions — a product, bootcamp, mentorship, etc.",
    color: "blue",
  },
];

const COLOR_MAP = {
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

export function UpgradePlanFormDialog({
  open,
  onOpenChange,
  isEditing,
  isSubmitting,
  form,
  setField,
  cohortSessionsList,
  onSubmit,
}: UpgradePlanFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[96vw] sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-bold">
            {isEditing ? "Edit Plan" : "Add New Plan"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fill in the fields below. All plans appear in the user-facing upgrade popup.
          </p>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
        >
          {/* Plan Type */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Plan Type *
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PLAN_TYPE_OPTIONS.map((opt) => {
                const colors = COLOR_MAP[opt.color];
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

          {/* Card Header */}
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

          {/* Pricing */}
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
                  <span className="text-gray-400 font-normal">(strikethrough)</span>
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

          {/* Session Access (session_based only) */}
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
                    Count is auto-set from the pinned sessions below.
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
                    If pinned, only those sessions are included. Otherwise user picks any {form.includedCount}.
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
                                : form.includedSessionIds.filter((id) => id !== s.id);
                              setField("includedSessionIds", next);
                              setField("includedCount", String(next.length > 0 ? next.length : 1));
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span>{sIdx + 1}. {s.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </fieldset>
          )}

          {/* Features */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Features List
            </legend>
            <label className="text-xs text-gray-500 block">
              One feature per line — shown as bullet points on the plan card.
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

          {/* Display Settings */}
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
                <label htmlFor="is-active-toggle" className="text-sm font-medium cursor-pointer">
                  Active (visible to users)
                </label>
              </div>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
