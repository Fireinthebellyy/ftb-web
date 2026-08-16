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
import { toast } from "sonner";

export interface UpgradePlan {
  id: string;
  cohortId: string;
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

export interface CohortSessionItem {
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

interface CohortUpgradeGridProps {
  cohortId: string;
  cohortTitle: string;
  currentPlanStatus?: CurrentPlanStatus | null;
  upgradePlans?: UpgradePlan[] | null;
  sessions?: CohortSessionItem[];
  onUpgradeSuccess: () => void;
  buyerName?: string;
  buyerEmail?: string;
}

export function CohortUpgradeGrid({
  cohortId,
  cohortTitle: _cohortTitle,
  currentPlanStatus,
  upgradePlans = [],
  sessions = [],
  onUpgradeSuccess,
  buyerName = "Learner",
  buyerEmail = "",
}: CohortUpgradeGridProps) {
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [sessionPickerPlan, setSessionPickerPlan] = useState<UpgradePlan | null>(null);
  const [selectedSessionIdsForPicker, setSelectedSessionIdsForPicker] = useState<string[]>([]);

  const displayPlans = upgradePlans || [];

  const handleCardClick = (plan: UpgradePlan) => {
    if (plan.isAllInOne) {
      handleUpgrade(plan, []);
      return;
    }

    // Custom / General plan: no session logic, go straight to upgrade
    const isCustomPlan =
      !plan.isAllInOne &&
      (!plan.includedSessionIds || plan.includedSessionIds.length === 0) &&
      !plan.includedSessionCount;
    if (isCustomPlan) {
      handleUpgrade(plan, []);
      return;
    }

    const unpurchasedSessions = sessions.filter((s) => !s.isAccessible);
    if (unpurchasedSessions.length === 0) {
      toast.info("All sessions in this cohort are already unlocked!");
      return;
    }

    // Case 1: Package has fixed included session IDs
    if (plan.includedSessionIds && plan.includedSessionIds.length > 0) {
      const ownedInPlan = plan.includedSessionIds.filter((id) =>
        sessions.some((s) => s.id === id && s.isAccessible)
      );

      // If user already owns 1 or more sessions in this fixed package
      if (ownedInPlan.length > 0) {
        const unownedInPlan = plan.includedSessionIds.filter(
          (id) => !ownedInPlan.includes(id)
        );
        const replacementCandidates = unpurchasedSessions
          .filter((s) => !plan.includedSessionIds?.includes(s.id))
          .map((s) => s.id);

        const targetCount = plan.includedSessionIds.length;
        const requiredCount = Math.min(targetCount, unpurchasedSessions.length);

        if (requiredCount <= 0) {
          toast.info("All sessions for this package are already unlocked!");
          return;
        }

        const initialSelected = [
          ...unownedInPlan,
          ...replacementCandidates.slice(0, Math.max(0, targetCount - unownedInPlan.length)),
        ].slice(0, requiredCount);

        setSelectedSessionIdsForPicker(initialSelected);
        setSessionPickerPlan(plan);
        return;
      }

      // No overlap: buy directly
      handleUpgrade(plan, plan.includedSessionIds);
      return;
    }

    // Case 2: Open session-based choice
    const targetCount = plan.includedSessionCount || 1;
    const requiredCount = Math.min(targetCount, unpurchasedSessions.length);

    if (requiredCount <= 0) {
      toast.info("All sessions in this cohort are already unlocked!");
      return;
    }

    const initialSelected = unpurchasedSessions
      .slice(0, requiredCount)
      .map((s) => s.id);

    setSelectedSessionIdsForPicker(initialSelected);
    setSessionPickerPlan(plan);
  };

  const handleUpgrade = async (plan: UpgradePlan, chosenSessionIds: string[] = []) => {
    try {
      setProcessingPlanId(plan.id);

      // 1. Post to checkout endpoint
      const response = await axios.post(`/api/cohorts/${cohortId}/checkout`, {
        selectedUpgradePlanId: plan.id,
        selectedAddOnIds: chosenSessionIds.length > 0 ? chosenSessionIds : (plan.includedSessionIds || []),
        price: plan.price,
        isAllInOne: plan.isAllInOne,
        buyerName: buyerName && buyerName !== "Learner" ? buyerName : undefined,
        buyerEmail: buyerEmail || undefined,
      });

      if (!response.data || !response.data.success) {
        toast.error(response.data?.error || "Failed to initialize upgrade");
        setProcessingPlanId(null);
        return;
      }

      // If free or instantly unlocked
      if (response.data.free) {
        toast.success("Upgrade Successful!");
        onUpgradeSuccess();
        setProcessingPlanId(null);
        return;
      }

      // 2. Load Razorpay SDK
      const scriptLoaded = await new Promise<boolean>((resolve) => {
        if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please check connection.");
        setProcessingPlanId(null);
        return;
      }

      const { order, key } = response.data;
      if (!order || !key) {
        toast.error("Payment setup failed. Please try again.");
        setProcessingPlanId(null);
        return;
      }

      const options: RazorpayCheckoutOptions = {
        key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Fire In The Belly",
        description: `Upgrade: ${plan.title}`,
        order_id: order.id,
        handler: async (razorpayResponse: RazorpayResponse) => {
          try {
            const verifyRes = await axios.post(
              `/api/cohorts/${cohortId}/checkout/verify`,
              {
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }
            );

            if (verifyRes.data.success) {
              toast.success("Plan Upgrade Complete! Sessions unlocked.");
              onUpgradeSuccess();
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Error verifying payment");
          } finally {
            setProcessingPlanId(null);
          }
        },
        prefill: {
          name: buyerName !== "Learner" ? buyerName : undefined,
          email: buyerEmail || undefined,
        },
        theme: {
          color: "#ea580c",
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
            toast.info("Upgrade cancelled");
          },
        },
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: RazorpayCheckoutOptions) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayConstructor(options);
      rzp.open();
    } catch (err) {
      console.error("Error during upgrade checkout:", err);
      toast.error("An error occurred during checkout");
      setProcessingPlanId(null);
    }
  };

  const purchasedCount = currentPlanStatus?.purchasedSessionsCount ?? 1;
  const totalCount = currentPlanStatus?.totalSessionsCount ?? 8;
  const amountPaid = currentPlanStatus?.amountPaid ?? 0;

  return (
    <div className="w-full space-y-4 pt-4">
      {/* Cards: full-width landscape on mobile, portrait from sm+ */}
      <div className="flex flex-col sm:flex-row gap-4 flex-nowrap justify-center items-stretch sm:items-center pb-3 -mx-1 px-1">
        {/* Current Plan Card */}
        <div className="w-full sm:w-[280px] sm:h-[450px] rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b pb-2 sm:pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Current Plan
              </span>
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 sm:gap-0 sm:space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-500 font-medium">Price Paid</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  ₹{amountPaid.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="space-y-1.5 sm:pt-2 sm:border-t border-gray-100">
                <div className="text-xs text-gray-500 font-medium">Plan Details</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug">
                  {currentPlanStatus?.isAllInOne
                    ? "All-In-One Full Bundle Pass — Complete access to all live sessions & recordings"
                    : `${purchasedCount} of ${totalCount} Sessions Chosen & Unlocked`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Plan Cards */}
        {displayPlans.map((plan) => {
          const isFeatured = plan.badgeText?.toLowerCase().includes("popular") || plan.isAllInOne;
          const savings = plan.originalPrice ? plan.originalPrice - plan.price : null;
          const ownedCount =
            plan.includedSessionIds?.filter((sId) =>
              sessions.find((s) => s.id === sId && s.isAccessible)
            ).length ?? 0;

          const sessionsBlock = plan.isAllInOne ? (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5 sm:p-3 text-gray-900 space-y-1">
              <div className="font-bold text-xs uppercase tracking-wider text-gray-800">
                All Cohort Sessions Included
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Complete access to all live interactive sessions, recordings & downloads.
              </p>
            </div>
          ) : plan.includedSessionIds && plan.includedSessionIds.length > 0 ? (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-gray-800">
                <span>Included Sessions ({plan.includedSessionIds.length}):</span>
                {ownedCount > 0 && (
                  <span className="text-[10px] bg-gray-200 text-gray-800 font-semibold px-2 py-0.5 rounded">
                    {ownedCount} Owned
                  </span>
                )}
              </div>
              <ul className="space-y-1 sm:space-y-1.5 max-h-28 sm:max-h-40 overflow-y-auto pr-1">
                {plan.includedSessionIds.map((sId) => {
                  const matched = sessions?.find((s) => s.id === sId);
                  const isAlreadyOwned = matched?.isAccessible;
                  return (
                    <li key={sId} className="flex items-start justify-between gap-2 text-xs font-medium text-gray-800 leading-snug">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <span className="text-gray-400 shrink-0">•</span>
                        <span className="break-words font-semibold">
                          {matched ? matched.title : "Live Cohort Session"}
                        </span>
                      </div>
                      {isAlreadyOwned && (
                        <span className="text-[10px] font-semibold text-gray-600 bg-gray-200/80 px-1.5 py-0.5 rounded shrink-0">
                          In Plan
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {ownedCount > 0 && (
                <div className="pt-2 border-t border-gray-200 text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed">
                  You already own {ownedCount} of these. Swap them for unpurchased sessions at checkout.
                </div>
              )}
            </div>
          ) : plan.includedSessionCount !== null ? (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5 sm:p-3 text-xs font-medium text-gray-800">
              Choice of any {plan.includedSessionCount ?? 1} Live Sessions
            </div>
          ) : null;

          const featuresBlock = (
            <div className="space-y-2 sm:pt-2 sm:border-t border-gray-100">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Features</div>
              <ul className="space-y-1 sm:space-y-1.5 text-xs text-gray-700">
                {plan.isAllInOne && (
                  <li className="flex items-start gap-2 font-semibold text-gray-900">
                    <span className="shrink-0">•</span>
                    <span>All Sessions & Recordings Unlocked</span>
                  </li>
                )}
                {plan.features && plan.features.length > 0 ? (
                  plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <span className="text-gray-400 shrink-0">•</span>
                      <span className="font-medium leading-snug">{feat}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 shrink-0">•</span>
                      <span className="font-medium">Live Interactive Session Access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 shrink-0">•</span>
                      <span className="font-medium">Resource & Slide Downloads</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          );

          return (
            <div
              key={plan.id}
              className={`w-full sm:w-[280px] sm:h-[450px] rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between relative transition-all ${
                isFeatured
                  ? "bg-white border-orange-500 ring-2 ring-orange-500/10"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              {plan.badgeText && (
                <div
                  className={`absolute top-0 right-0 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl border-l border-b ${
                    isFeatured
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }`}
                >
                  {plan.badgeText}
                </div>
              )}

              <div className="pt-1 flex-1 min-h-0 overflow-y-auto sm:overflow-visible">
                <div className="space-y-1 pr-14 sm:pr-0">
                  <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    {(plan as any).sectionLabel ||
                      (plan.isAllInOne
                        ? "Full Cohort Upgrade"
                        : "Package Option")}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                    {plan.title}
                  </h3>
                  {plan.description && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-0 sm:space-y-4">
                  <div className="space-y-3 sm:space-y-4 min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl sm:text-2xl font-bold text-gray-900">
                          ₹{plan.price.toLocaleString("en-IN")}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-xs text-gray-400 line-through font-medium">
                            ₹{plan.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {savings && savings > 0 && (
                        <span className="inline-block rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          Save ₹{savings.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    {sessionsBlock}
                  </div>

                  <div className="min-w-0">{featuresBlock}</div>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 mt-auto shrink-0">
                <Button
                  onClick={() => handleCardClick(plan)}
                  disabled={processingPlanId === plan.id}
                  className={`w-full text-xs font-bold py-2.5 rounded-lg transition-all ${
                    isFeatured
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                >
                  {processingPlanId === plan.id ? (
                    "Processing..."
                  ) : !plan.isAllInOne && plan.includedSessionIds && plan.includedSessionIds.length > 0 && plan.includedSessionIds.some(sId => sessions.find(s => s.id === sId && s.isAccessible)) ? (
                    "Swap Owned Sessions & Upgrade"
                  ) : !plan.isAllInOne && plan.includedSessionCount && (!plan.includedSessionIds || plan.includedSessionIds.length === 0) ? (
                    "Select Sessions & Upgrade"
                  ) : (
                    "Upgrade Plan"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Selection Dialog for Session-Based Packages */}
      {sessionPickerPlan && (
        <Dialog
          open={Boolean(sessionPickerPlan)}
          onOpenChange={(open) => {
            if (!open) setSessionPickerPlan(null);
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[1400px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                Select Sessions to Unlock — {sessionPickerPlan.title}
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-1">
                Choose up to {sessionPickerPlan.includedSessionCount ?? 1} sessions you would like to access with this package.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {(() => {
                const targetCount = sessionPickerPlan.includedSessionIds && sessionPickerPlan.includedSessionIds.length > 0
                  ? sessionPickerPlan.includedSessionIds.length
                  : (sessionPickerPlan.includedSessionCount || 1);
                const unpurchasedTotal = sessions.filter((s: any) => !s.isAccessible).length;
                const requiredCount = Math.min(targetCount, unpurchasedTotal);
                const isReady = selectedSessionIdsForPicker.length === requiredCount;
                const remainingNeeded = requiredCount - selectedSessionIdsForPicker.length;

                return (
                  <>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 border border-gray-200">
                      <span className="text-xs font-semibold text-gray-700">
                        Selected Sessions:
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                        isReady
                          ? "bg-gray-900 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}>
                        {selectedSessionIdsForPicker.length} / {requiredCount} Required
                      </span>
                    </div>

                    {!isReady && (
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 text-xs text-gray-700 font-medium">
                        Please select {remainingNeeded} more session(s) to enable payment button.
                      </div>
                    )}

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {sessions.map((s: any, idx: number) => {
                        const isAlreadyAccessible = s.isAccessible;
                        const isChecked = selectedSessionIdsForPicker.includes(s.id);

                        return (
                          <label
                            key={s.id}
                            className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                              isAlreadyAccessible
                                ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                                : isChecked
                                ? "bg-white border-orange-500 font-semibold ring-1 ring-orange-500"
                                : "bg-white border-gray-200 hover:border-gray-300 cursor-pointer"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                disabled={isAlreadyAccessible}
                                checked={isChecked || isAlreadyAccessible}
                                onChange={(e) => {
                                  if (isAlreadyAccessible) return;
                                  if (e.target.checked) {
                                    if (selectedSessionIdsForPicker.length >= requiredCount) {
                                      toast.error(`You can only select exactly ${requiredCount} sessions for this package.`);
                                      return;
                                    }
                                    setSelectedSessionIdsForPicker([...selectedSessionIdsForPicker, s.id]);
                                  } else {
                                    setSelectedSessionIdsForPicker(
                                      selectedSessionIdsForPicker.filter((id) => id !== s.id)
                                    );
                                  }
                                }}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4 mt-0.5"
                              />
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-gray-900 leading-snug break-words">
                                  Session {idx + 1}: {s.title}
                                </p>
                                {isAlreadyAccessible && (
                                  <span className="inline-block text-[10px] text-gray-600 font-semibold bg-gray-100 px-1.5 py-0.5 rounded">
                                    Already Unlocked
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionPickerPlan(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!isReady}
                        onClick={() => {
                          if (!isReady) {
                            toast.error(`Please select exactly ${requiredCount} sessions to proceed.`);
                            return;
                          }
                          const plan = sessionPickerPlan;
                          setSessionPickerPlan(null);
                          handleUpgrade(plan, selectedSessionIdsForPicker);
                        }}
                        className={`text-xs font-bold ${
                          isReady
                            ? "bg-orange-600 hover:bg-orange-700 text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {isReady
                          ? `Pay ₹${sessionPickerPlan.price.toLocaleString("en-IN")} & Unlock ${selectedSessionIdsForPicker.length} Sessions`
                          : `Select ${remainingNeeded} More Session(s)`}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
