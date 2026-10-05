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
import { useSprintDetail, useSprintSession } from "@/lib/queries-sprints";
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

  const {
    data: sprintData,
    isLoading: isSprintLoading,
    refetch: refetchSprint,
  } = useSprintDetail(sprintId);

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
      targetId =
        accessibleSessions.length > 0
          ? accessibleSessions[0].id
          : sessions[0].id;
      setCurrentSessionId(targetId);
    }

    try {
      localStorage.setItem(`sprint:${sprintId}:session`, targetId);
    } catch {
      /* noop */
    }
    if (
      typeof window !== "undefined" &&
      window.location.hash !== `#${targetId}`
    ) {
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
      <div className="min-h-screen space-y-6 bg-black p-6 text-white">
        <Skeleton className="h-10 w-48 bg-zinc-800" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Skeleton className="h-96 rounded-xl bg-zinc-800" />
          <Skeleton className="h-96 rounded-xl bg-zinc-800 md:col-span-3" />
        </div>
      </div>
    );
  }

  if (sprintData?.isLocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
        <Lock className="mb-4 h-12 w-12 text-amber-400" />
        <h1 className="mb-2 text-2xl font-bold">Access Pending Verification</h1>
        <p className="mb-6 max-w-md text-sm text-zinc-400">
          Your enrollment for {sprintData.sprint?.title} is being verified by
          our team.
        </p>
        <Button
          onClick={() => router.push(`/toolkit/sprints/${sprintId}`)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Back to Sprint Details
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black font-sans text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/toolkit/sprints/${sprintId}`)}
            className="gap-1 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Sprint Info
          </Button>
          <span className="text-zinc-700">|</span>
          <h1 className="max-w-xs truncate text-sm font-bold text-white md:max-w-md">
            {sprintData?.sprint?.title}
          </h1>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-72 space-y-2 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4 md:block">
          <h2 className="mb-3 text-xs font-bold tracking-wider text-zinc-400 uppercase">
            Sprint Sessions
          </h2>
          {sessions.map((s: any, idx: number) => {
            const isSelected = s.id === currentSessionId;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors",
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/20 font-bold text-orange-400"
                    : "border-zinc-800/80 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900"
                )}
              >
                <span className="truncate pr-2">
                  {idx + 1}. {s.title}
                </span>
                {s.isAccessible ? (
                  <Unlock className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Content View */}
        <main className="mx-auto max-w-4xl flex-1 space-y-8 overflow-y-auto p-4 md:p-8">
          {currentSessionMeta && (
            <div className="border-b border-zinc-800 pb-4">
              <span className="text-xs font-bold tracking-wider text-orange-500 uppercase">
                Current Session
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {currentSessionMeta.title}
              </h2>
            </div>
          )}

          {!isCurrentSessionAccessible ? (
            <div className="my-8 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
              <Lock className="mx-auto h-10 w-10 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Session Locked</h3>
              <p className="mx-auto max-w-md text-xs text-zinc-400">
                Upgrade your pass to unlock this session and access live links,
                recordings, and resources.
              </p>
              <Button
                onClick={() => setUpgradeModalOpen(true)}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-2.5 text-xs font-bold text-black hover:from-orange-600 hover:to-amber-700"
              >
                Upgrade Sprint Pass
              </Button>
            </div>
          ) : isSessionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-xl bg-zinc-900" />
              <Skeleton className="h-48 rounded-xl bg-zinc-900" />
            </div>
          ) : (
            <div className="space-y-6">
              {(sessionDetail?.contents || []).map(
                (c: SprintSessionContent) => (
                  <div
                    key={c.id}
                    className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
                  >
                    <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase">
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
                          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
                        >
                          Join Live Session
                        </a>
                      </div>
                    )}

                    {c.resources && c.resources.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-zinc-800/60 pt-4">
                        <h4 className="text-xs font-bold text-zinc-300">
                          Resources:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {c.resources.map((r: SprintSessionResource) => (
                            <a
                              key={r.id}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
                            >
                              📎 {r.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Upgrade Section */}
          <SprintUpgradeGrid
            sprintId={sprintData?.sprint?.id || sprintId}
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
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-zinc-800 bg-zinc-900 text-white">
          <DialogHeader>
            <DialogTitle>Upgrade Sprint Passes</DialogTitle>
          </DialogHeader>
          <SprintUpgradeGrid
            sprintId={sprintData?.sprint?.id || sprintId}
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
