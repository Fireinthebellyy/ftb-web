"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SurveySource =
  | "instagram"
  | "reddit"
  | "youtube"
  | "x_twitter"
  | "linkedin"
  | "chatgpt"
  | "google_search"
  | "whatsapp_group"
  | "friend_or_senior"
  | "campus_event"
  | "other";

const SURVEY_TRIGGER_KEY = "ftb:post-onboarding-survey:trigger";
const SURVEY_SUBMITTED_KEY = "ftb:post-onboarding-survey:submitted";
const SURVEY_DISMISSED_UNTIL_KEY = "ftb:post-onboarding-survey:dismissed-until";
const DISMISS_DAYS = 30;

const sourceOptions: Array<{ value: SurveySource; label: string }> = [
  { value: "instagram", label: "Instagram" },
  { value: "reddit", label: "Reddit" },
  { value: "youtube", label: "YouTube" },
  { value: "x_twitter", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "chatgpt", label: "ChatGPT / LLM" },
  { value: "google_search", label: "Google Search" },
  { value: "whatsapp_group", label: "WhatsApp group" },
  { value: "friend_or_senior", label: "Friend / senior" },
  { value: "campus_event", label: "Campus event" },
  { value: "other", label: "Other" },
];

function getDismissedUntil(): number {
  try {
    const raw = localStorage.getItem(SURVEY_DISMISSED_UNTIL_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function setDismissedUntil(days: number) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(SURVEY_DISMISSED_UNTIL_KEY, String(until));
  } catch {
    return;
  }
}

export default function PostOnboardingSurveyWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [source, setSource] = useState<SurveySource | null>(null);
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkShouldShow = async () => {
      if (pathname !== "/opportunities") {
        setOpen(false);
        setBootstrapped(true);
        return;
      }

      const queryTriggered = searchParams.get("onboardingSurvey") === "1";
      const storageTriggered =
        typeof window !== "undefined" &&
        sessionStorage.getItem(SURVEY_TRIGGER_KEY) === "1";

      if (!queryTriggered && !storageTriggered) {
        setOpen(false);
        setBootstrapped(true);
        return;
      }

      if (typeof window !== "undefined") {
        const dismissedUntil = getDismissedUntil();
        const alreadySubmitted =
          localStorage.getItem(SURVEY_SUBMITTED_KEY) === "1";
        if (alreadySubmitted || dismissedUntil > Date.now()) {
          setOpen(false);
          setBootstrapped(true);
          return;
        }
      }

      try {
        const response = await fetch("/api/onboarding-survey", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setBootstrapped(true);
          return;
        }

        const data = (await response.json()) as { submitted?: boolean };
        if (!data.submitted) {
          setOpen(true);
        } else if (typeof window !== "undefined") {
          localStorage.setItem(SURVEY_SUBMITTED_KEY, "1");
        }
      } catch {
        return;
      } finally {
        setBootstrapped(true);
      }
    };

    checkShouldShow();
  }, [pathname, searchParams]);

  const canSubmit = useMemo(() => {
    if (!source || submitting) return false;
    if (source !== "other") return true;
    return otherText.trim().length >= 2;
  }, [otherText, source, submitting]);

  const dismissSurvey = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      setDismissedUntil(DISMISS_DAYS);
      sessionStorage.removeItem(SURVEY_TRIGGER_KEY);
    }
  };

  const submitSurvey = async () => {
    if (!canSubmit || !source) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/onboarding-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          source,
          sourceOther: source === "other" ? otherText.trim() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(SURVEY_SUBMITTED_KEY, "1");
        sessionStorage.removeItem(SURVEY_TRIGGER_KEY);
      }

      toast.success("Thanks! this helps us grow smarter.");
      setOpen(false);
    } catch {
      toast.error("Could not submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!bootstrapped || !open) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] md:right-6 md:bottom-6 md:left-auto md:w-[24rem]">
      <form
        className="overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-[0_14px_40px_-16px_rgba(249,115,22,0.55)]"
        onSubmit={(e) => {
          e.preventDefault();
          submitSurvey();
        }}
      >
        <button
          type="button"
          aria-label="Close survey"
          className="absolute top-3 right-3 rounded-md p-1 text-neutral-500 transition hover:bg-orange-50 hover:text-orange-600"
          onClick={dismissSurvey}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.8),_rgba(255,255,255,0.98)_55%)] p-4 pt-5 sm:p-5">
          <div className="pr-8">
            <h3 className="text-base font-semibold text-neutral-900">
              Quick pulse check
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Where did you first hear about Fire in the Belly?
            </p>
          </div>

          <fieldset className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
            <legend className="sr-only">Select one source</legend>
            {sourceOptions.map((option) => {
              const checked = source === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                    checked
                      ? "border-orange-500 bg-orange-50 text-orange-900"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-orange-200 hover:bg-orange-50/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="source"
                    value={option.value}
                    checked={checked}
                    onChange={() => setSource(option.value)}
                    className="h-4 w-4 accent-orange-500"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </fieldset>

          {source === "other" ? (
            <div className="mt-3">
              <Input
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Tell us where"
                maxLength={120}
              />
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <Button type="submit" disabled={!canSubmit} className="h-10 flex-1">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                </span>
              ) : (
                "Submit"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={dismissSurvey}
              disabled={submitting}
            >
              Later
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
