"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSprintDetail,
  useSprintSession,
} from "@/lib/queries-sprints";
import { Skeleton } from "@/components/ui/skeleton";
import HtmlRenderer from "@/components/toolkit/HtmlRenderer";
import {
  SprintSessionContent,
  SprintSessionResource,
} from "@/types/interfaces";
import SprintUpgradeGrid from "./SprintUpgradeGrid";

export default function SprintDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sprintId = params.id as string;

  const getInitialSessionId = (): string | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash.replace("#", "");
    if (hash) return hash;
    try {
      return localStorage.getItem(`sprint:${sprintId}:session`);
    } catch {
      return null;
    }
  };

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    getInitialSessionId
  );
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const { data: sprintData, isLoading: isSprintLoading, refetch: refetchSprint } =
    useSprintDetail(sprintId);

  const sessions = useMemo(() => sprintData?.sessions ?? [], [sprintData]);

  useEffect(() => {
    if (sessions.length === 0) return;

    let targetId: string | null = null;

    if (currentSessionId) {
      const isValid = sessions.some((s: any) => s.id === currentSessionId);
      if (isValid) {
        targetId = currentSessionId;
      }
    }

    if (!targetId) {
      const accessibleSessions = sessions.filter((s: any) => s.isAccessible);
      targetId = accessibleSessions.length > 0 ? accessibleSessions[0].id : sessions[0].id;
      setCurrentSessionId(targetId);
    }

    try {
      localStorage.setItem(`sprint:${sprintId}:session`, targetId);
    } catch {
      /* noop */
    }
    if (typeof window !== "undefined" && window.location.hash !== `#${targetId}`) {
      history.replaceState(null, "", `#${targetId}`);
    }
  }, [sessions, currentSessionId, sprintId]);

  const currentSessionMeta = useMemo(
    () => sessions.find((s: any) => s.id === currentSessionId),
    [sessions, currentSessionId]
  );

  const isCurrentSessionAccessible = currentSessionMeta?.isAccessible ?? false;

  const { data: sessionDetail, isLoading: isSessionLoading } = useSprintSession(
    sprintId,
    isCurrentSessionAccessible ? currentSessionId || "" : ""
  );

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  if (isSprintLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 space-y-6">
        <Skeleton className="h-10 w-48 bg-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-96 bg-zinc-800 rounded-xl" />
          <Skeleton className="h-96 md:col-span-3 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (sprintData?.isLocked) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-12 h-12 text-amber-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Pending Verification</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          Your enrollment for {sprintData.sprint?.title} is being verified by our team.
        </p>
        <Button onClick={() => router.push(`/toolkit/sprints/${sprintId}`)} className="bg-orange-600 hover:bg-orange-700">
          Back to Sprint Details
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/toolkit/sprints/${sprintId}`)}
            className="text-zinc-400 hover:text-white gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Sprint Info
          </Button>
          <span className="text-zinc-700">|</span>
          <h1 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
            {sprintData?.sprint?.title}
          </h1>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-zinc-800 bg-zinc-950 p-4 space-y-2 hidden md:block overflow-y-auto">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Sprint Sessions
          </h2>
          {sessions.map((s: any, idx: number) => {
            const isSelected = s.id === currentSessionId;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl text-xs transition-colors flex items-center justify-between border",
                  isSelected
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-400 font-bold"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900"
                )}
              >
                <span className="truncate pr-2">
                  {idx + 1}. {s.title}
                </span>
                {s.isAccessible ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Content View */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-4xl mx-auto space-y-8">
          {currentSessionMeta && (
            <div className="border-b border-zinc-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Current Session
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {currentSessionMeta.title}
              </h2>
            </div>
          )}

          {!isCurrentSessionAccessible ? (
            <div className="p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-4 my-8">
              <Lock className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Session Locked</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Upgrade your pass to unlock this session and access live links, recordings, and resources.
              </p>
              <Button
                onClick={() => setUpgradeModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-bold text-xs px-6 py-2.5 rounded-xl"
              >
                Upgrade Sprint Pass
              </Button>
            </div>
          ) : isSessionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 bg-zinc-900 rounded-xl" />
              <Skeleton className="h-48 bg-zinc-900 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-6">
              {(sessionDetail?.contents || []).map((c: SprintSessionContent) => (
                <div key={c.id} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                    {c.sectionType.replace("_", " ")}
                  </span>
                  <h3 className="text-lg font-bold text-white">{c.title}</h3>
                  {c.content && <HtmlRenderer content={c.content} />}

                  {c.liveSessionLink && (
                    <div className="pt-2">
                      <a
                        href={c.liveSessionLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                      >
                        Join Live Session
                      </a>
                    </div>
                  )}

                  {c.resources && c.resources.length > 0 && (
                    <div className="pt-4 space-y-2 border-t border-zinc-800/60 mt-4">
                      <h4 className="text-xs font-bold text-zinc-300">Resources:</h4>
                      <div className="flex flex-wrap gap-2">
                        {c.resources.map((r: SprintSessionResource) => (
                          <a
                            key={r.id}
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200"
                          >
                            📎 {r.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upgrade Section */}
          <SprintUpgradeGrid
            sprintId={sprintId}
            sprintTitle={sprintData?.sprint?.title || "Sprint"}
            currentPlanStatus={sprintData?.currentPlanStatus}
            upgradePlans={sprintData?.upgradePlans}
            sessions={sessions}
            onUpgradeSuccess={() => {
              refetchSprint();
              setUpgradeModalOpen(false);
            }}
          />
        </main>
      </div>

      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upgrade Sprint Passes</DialogTitle>
          </DialogHeader>
          <SprintUpgradeGrid
            sprintId={sprintId}
            sprintTitle={sprintData?.sprint?.title || "Sprint"}
            currentPlanStatus={sprintData?.currentPlanStatus}
            upgradePlans={sprintData?.upgradePlans}
            sessions={sessions}
            onUpgradeSuccess={() => {
              refetchSprint();
              setUpgradeModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
