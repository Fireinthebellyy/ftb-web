"use client";

import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SprintUpgradePlan {
  id: string;
  sprintId: string;
  title: string;
  sectionLabel?: string | null;
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
}

export interface CurrentPlanStatus {
  purchasedSessionsCount: number;
  totalSessionsCount: number;
  amountPaid: number;
  isAllInOne: boolean;
  selectedAddOnIds: string[];
}

export interface SprintSessionItem {
  id: string;
  title: string;
  orderIndex?: number;
  isAccessible?: boolean;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name?: string;
    email?: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface SprintUpgradeGridProps {
  sprintId: string;
  sprintTitle: string;
  currentPlanStatus?: CurrentPlanStatus | null;
  upgradePlans?: SprintUpgradePlan[] | null;
  sessions?: SprintSessionItem[];
  onUpgradeSuccess: () => void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SprintUpgradeGrid({
  sprintId,
  sprintTitle: _sprintTitle,
  currentPlanStatus: _currentPlanStatus,
  upgradePlans,
  sessions = [],
  onUpgradeSuccess,
}: SprintUpgradeGridProps) {
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [sessionPickerPlan, setSessionPickerPlan] = useState<SprintUpgradePlan | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  if (!upgradePlans || upgradePlans.length === 0) {
    return null;
  }

  const handleInitiateUpgrade = async (
    plan: SprintUpgradePlan,
    overrideSelectedSessionIds?: string[]
  ) => {
    try {
      setPurchasingPlanId(plan.id);
      setIsCheckoutLoading(true);

      const res = await axios.post(`/api/sprints/${sprintId}/checkout`, {
        selectedUpgradePlanId: plan.id,
        selectedAddOnIds: overrideSelectedSessionIds || [],
      });

      const { orderId, amount, currency, key, freeOrder } = res.data;

      if (freeOrder) {
        toast.success("Free upgrade package unlocked!");
        setSessionPickerPlan(null);
        onUpgradeSuccess();
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load. Please try again.");
        return;
      }

      const options: RazorpayCheckoutOptions = {
        key,
        amount,
        currency,
        name: "Fire in the Belly",
        description: `Upgrade Pass: ${plan.title}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            await axios.post(`/api/sprints/${sprintId}/checkout/verify`, response);
            toast.success("Upgrade successful!");
            setSessionPickerPlan(null);
            onUpgradeSuccess();
          } catch (err) {
            console.error("Verification failed:", err);
            toast.error("Payment verification failed");
          }
        },
        prefill: {},
        theme: { color: "#f97316" },
        modal: {
          ondismiss: () => {
            setPurchasingPlanId(null);
            setIsCheckoutLoading(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      toast.error(err.response?.data?.error || "Failed to initiate checkout");
    } finally {
      setPurchasingPlanId(null);
      setIsCheckoutLoading(false);
    }
  };

  const handlePlanClick = (plan: SprintUpgradePlan) => {
    if (plan.isAllInOne) {
      handleInitiateUpgrade(plan);
      return;
    }

    if (plan.includedSessionCount && plan.includedSessionCount > 0) {
      const lockedSessions = sessions.filter((s) => !s.isAccessible);

      if (lockedSessions.length <= plan.includedSessionCount) {
        const autoSelected = lockedSessions.map((s) => s.id);
        handleInitiateUpgrade(plan, autoSelected);
        return;
      }

      setSessionPickerPlan(plan);
      setSelectedSessionIds([]);
      return;
    }

    handleInitiateUpgrade(plan);
  };

  const toggleSessionSelect = (sessionId: string, maxAllowed: number) => {
    setSelectedSessionIds((prev) => {
      if (prev.includes(sessionId)) {
        return prev.filter((id) => id !== sessionId);
      }
      if (prev.length >= maxAllowed) {
        toast.error(`You can select up to ${maxAllowed} sessions for this package`);
        return prev;
      }
      return [...prev, sessionId];
    });
  };

  return (
    <div className="space-y-6 my-8">
      <div className="border-b border-zinc-800 pb-4">
        <h3 className="text-xl font-bold text-white">Upgrade Sprint Passes</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Unlock additional live sessions or get complete full pass access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upgradePlans.map((plan) => {
          const isPurchasing = purchasingPlanId === plan.id && isCheckoutLoading;

          return (
            <div
              key={plan.id}
              className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors"
            >
              <div className="space-y-3">
                {plan.badgeText && (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded inline-block">
                    {plan.badgeText}
                  </span>
                )}

                <h4 className="text-lg font-extrabold text-white">{plan.title}</h4>
                {plan.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2">{plan.description}</p>
                )}

                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-amber-400">
                    ₹{plan.price.toLocaleString("en-IN")}
                  </span>
                  {plan.originalPrice && (
                    <span className="text-xs text-zinc-500 line-through">
                      ₹{plan.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="pt-3 border-t border-zinc-800/80 space-y-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-xs text-zinc-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                onClick={() => handlePlanClick(plan)}
                disabled={isPurchasing}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold py-2.5 text-xs rounded-xl mt-4"
              >
                {isPurchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Get ${plan.title}`}
              </Button>
            </div>
          );
        })}
      </div>

      {sessionPickerPlan && (
        <Dialog open={Boolean(sessionPickerPlan)} onOpenChange={() => setSessionPickerPlan(null)}>
          <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Select {sessionPickerPlan.includedSessionCount} Sessions
              </DialogTitle>
              <p className="text-xs text-zinc-400">
                Choose the live sessions you wish to unlock with {sessionPickerPlan.title}.
              </p>
            </DialogHeader>

            <div className="py-4 space-y-2 max-h-60 overflow-y-auto">
              {sessions
                .filter((s) => !s.isAccessible)
                .map((s) => {
                  const selected = selectedSessionIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        toggleSessionSelect(s.id, sessionPickerPlan.includedSessionCount || 1)
                      }
                      className={cn(
                        "w-full text-left p-3 rounded-lg border text-xs transition-colors flex items-center justify-between",
                        selected
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      )}
                    >
                      <span className="truncate">{s.title}</span>
                      {selected && <span className="font-bold text-amber-400">Selected</span>}
                    </button>
                  );
                })}
            </div>

            <Button
              disabled={
                selectedSessionIds.length !== (sessionPickerPlan.includedSessionCount || 1) ||
                isCheckoutLoading
              }
              onClick={() => handleInitiateUpgrade(sessionPickerPlan, selectedSessionIds)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs py-2.5 rounded-lg"
            >
              {isCheckoutLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                `Confirm & Checkout (Selected ${selectedSessionIds.length}/${sessionPickerPlan.includedSessionCount})`
              )}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
