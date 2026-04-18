"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Compass,
  Lightbulb,
  Loader2,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  INTEREST_PROMPT_STORAGE_KEY,
  type InterestAreaId,
  type InterestPromptBgVariant,
} from "@/lib/interest-prompt";
import { useSession, useInvalidateSession } from "@/hooks/use-session";

type InterestOption = {
  id: InterestAreaId;
  label: string;
  Icon: LucideIcon;
};

const OPTIONS: InterestOption[] = [
  { id: "internships", label: "Internships", Icon: BookOpen },
  { id: "internship_guidance", label: "Internship Guidance", Icon: Compass },
  { id: "opportunities", label: "Opportunities", Icon: Lightbulb },
  { id: "college_guidance", label: "College Guidance", Icon: School },
];

function readStoredBgVariant(): InterestPromptBgVariant {
  if (typeof window === "undefined") return "blur";
  const raw = sessionStorage.getItem(INTEREST_PROMPT_STORAGE_KEY);
  return raw === "white" ? "white" : "blur";
}

export default function InterestPromptGate() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const invalidateSession = useInvalidateSession();
  const { data: session, isPending: sessionPending } = useSession();
  const [bgVariant, setBgVariant] = useState<InterestPromptBgVariant>("blur");
  const [selected, setSelected] = useState<Set<InterestAreaId>>(new Set());

  const skip =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  const interestQuery = useQuery({
    queryKey: ["interest-prompt"],
    queryFn: async () => {
      const res = await fetch("/api/user/interest-prompt");
      if (!res.ok) throw new Error("Failed to load interest prompt status");
      return res.json() as Promise<{ needsPrompt: boolean; areas: string[] }>;
    },
    enabled: Boolean(session?.user) && !skip,
    staleTime: 1000 * 60 * 5,
  });

  const needsPrompt = Boolean(interestQuery.data?.needsPrompt);
  /** Full-screen gate only after the interest query has resolved and needsPrompt is true */
  const showGate =
    Boolean(session?.user) &&
    !skip &&
    !interestQuery.isError &&
    !interestQuery.isPending &&
    needsPrompt;

  useEffect(() => {
    if (!showGate) return;
    setBgVariant(readStoredBgVariant());
  }, [showGate]);

  useEffect(() => {
    if (!showGate) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showGate]);

  const toggle = (id: InterestAreaId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (areas: InterestAreaId[]) => {
      const res = await fetch("/api/user/interest-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Could not save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest-prompt"] });
      invalidateSession();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Could not save your interests");
    },
  });

  const canSubmit = selected.size > 0;
  const backdropClass = useMemo(
    () =>
      bgVariant === "white"
        ? "bg-white"
        : "bg-black/25 backdrop-blur-[6px]",
    [bgVariant]
  );

  if (sessionPending || !session?.user || skip) {
    return null;
  }

  if (!showGate) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center px-4",
        backdropClass
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interest-prompt-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
        <h2
          id="interest-prompt-title"
          className="text-center text-2xl font-bold tracking-tight text-neutral-900"
        >
          What are you interested in?
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {OPTIONS.map(({ id, label, Icon }) => {
            const isOn = selected.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-left transition-colors",
                  "border-amber-200/90 bg-white hover:bg-amber-50/50",
                  isOn && "border-primary bg-primary/5 ring-2 ring-primary/30"
                )}
              >
                <Icon
                  className="text-primary size-6 shrink-0"
                  strokeWidth={1.75}
                />
                <span className="text-[13px] font-medium text-neutral-600">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          className="mt-8 w-full"
          size="lg"
          disabled={!canSubmit || saveMutation.isPending}
          onClick={() => {
            saveMutation.mutate(Array.from(selected));
          }}
        >
          {saveMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </span>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
