/* eslint-disable max-lines */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function getDuoPricing(singlePrice: number) {
  if (!singlePrice || singlePrice <= 0) {
    return { reference: 0, final: 0, perHead: 0 };
  }
  const raw_duo = singlePrice * 2;
  const reference = Math.ceil((raw_duo + 1) / 100) * 100 - 1;
  const final = Math.round((reference * 0.8) / 10) * 10 - 1;
  const perHead = Math.round(final / 2);
  return { reference, final, perHead };
}

interface Mentor {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  bio?: string;
  link?: string;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface Tier {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  description?: string;
  features?: string[];
  isDefault?: boolean;
}

interface AddOn {
  id: string;
  title: string;
  price: number;
  description?: string;
}

interface Session {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  originalPrice?: number | null;
}

interface SprintData {
  id: string;
  title: string;
  subtitle?: string;
  badge1?: string;
  badge2?: string;
  coverImageUrl?: string;
  coverImageUrls?: string[];
  cardImageUrl?: string;
  startDate?: string;
  highlights?: string[];
  mentorsHeading?: string;
  featuresHeading?: string;
  sessionsHeading?: string;
  whoIsThisForHeading?: string;
  whoIsThisForBullets?: string[];
  investmentLabel?: string;
  basePrice: number;
  originalPrice?: number;
  isActive: boolean;
  isBestSeller?: boolean;
  isFillingFast?: boolean;
  mentors: Mentor[];
  features: Feature[];
  tiers: Tier[];
  addOns: AddOn[];
  sessions?: Session[];
  hasAccess?: boolean;
}

export default function SprintDetailClient() {
  const params = useParams();
  const router = useRouter();
  const sprintId = params?.id as string;

  const [sprint, setSprint] = useState<SprintData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSprint = useCallback(async () => {
    if (!sprintId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/sprints/${sprintId}`);
      setSprint(res.data);
    } catch (err) {
      console.error("Error loading sprint:", err);
      toast.error("Sprint not found");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    fetchSprint();
  }, [fetchSprint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold">Sprint Not Found</h1>
        <Button onClick={() => router.push("/")} className="bg-orange-600 hover:bg-orange-700">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-black">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {sprint.badge1 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {sprint.badge1}
              </span>
            )}
            {sprint.badge2 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {sprint.badge2}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {sprint.title}
          </h1>
          {sprint.subtitle && (
            <p className="text-base md:text-lg text-zinc-400 max-w-2xl">
              {sprint.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Features */}
          {sprint.features?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{sprint.featuresHeading}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sprint.features.map((f) => (
                  <div key={f.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                    <h3 className="text-base font-semibold text-orange-400">{f.title}</h3>
                    <p className="text-xs text-zinc-400">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum */}
          {sprint.sessions?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">
                {sprint.sessionsHeading || "Sprint Sessions & Curriculum"}
              </h2>
              <div className="space-y-3">
                {sprint.sessions.map((s, idx) => (
                  <div key={s.id} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                        Session {idx + 1}
                      </span>
                      <h4 className="text-base font-semibold text-white mt-0.5">{s.title}</h4>
                      {s.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{s.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 sticky top-6">
            <h3 className="text-lg font-bold text-white">{sprint.investmentLabel}</h3>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                ₹{sprint.basePrice.toLocaleString("en-IN")}
              </span>
              {sprint.originalPrice && (
                <span className="text-sm text-zinc-500 line-through">
                  ₹{sprint.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {sprint.hasAccess ? (
              <Button
                onClick={() => router.push(`/toolkit/sprints/${sprint.id}/dashboard`)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm rounded-xl"
              >
                Go to Learner Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => router.push(`/toolkit/sprints/${sprint.id}/registration`)}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-bold py-3 text-sm rounded-xl shadow-lg shadow-orange-500/20"
              >
                Enroll Now <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
