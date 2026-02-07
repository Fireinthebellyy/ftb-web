"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  domainOptions,
  educationLevels,
  fieldOptions,
  opportunityOptions,
  stateOptions,
  stepAnim,
} from "@/app/onboarding/constants";
import {
  fetchOnboardingProfile,
  OnboardingProfile,
  saveOnboardingProfile,
  SaveOnboardingProfileInput,
} from "@/lib/queries";
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import {
  OptionCard,
  SelectableButton,
  SummaryItem,
  SummaryList,
  PreviewItem,
  PreviewList,
} from "@/components/onboarding";

type Role = "student" | "society";

type Answers = {
  role: Role | null;
  // Keep location as a *light* optional signal.
  state: string;
  city: string;
  educationLevel: string;
  fieldOfStudy: string;
  fieldOther: string;
  opportunities: string[];
  domains: string[];
};

type Step =
  | { id: "role"; title: string; description: string }
  | { id: "basics"; title: string; description: string }
  | { id: "interests"; title: string; description: string }
  | { id: "wrap"; title: string; description: string };

function titleCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function pickLabel(list: string[], max = 3) {
  if (!list.length) return "—";
  if (list.length <= max) return list.join(", ");
  return `${list.slice(0, max).join(", ")} +${list.length - max}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    role: null,
    state: "",
    city: "",
    educationLevel: "",
    fieldOfStudy: "",
    fieldOther: "",
    opportunities: [],
    domains: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: Step[] = useMemo(() => {
    // Student-first, low-friction, gamified-lite.
    // Goal: collect *just enough* to personalize without feeling like a form.
    return [
      {
        id: "role",
        title: "Pick your path",
        description: "This takes ~60 seconds. Skip anything you want.",
      },
      {
        id: "basics",
        title: "Quick basics",
        description: "Just enough to tune your feed (no pressure).",
      },
      {
        id: "interests",
        title: "What should we prioritize?",
        description: "Choose a few. You can change this later.",
      },
      {
        id: "wrap",
        title: "You’re set",
        description: "Review and start exploring.",
      },
    ];
  }, []);

  const profileQuery = useQuery<OnboardingProfile | null>({
    queryKey: ["onboarding-profile"],
    queryFn: fetchOnboardingProfile,
    staleTime: 1000 * 60 * 5,
  });

  const hasHydratedProfile = useRef(false);

  useEffect(() => {
    if (!hasHydratedProfile.current && profileQuery.data) {
      const profile = profileQuery.data;
      const persona: Role | null =
        profile.persona === "student" || profile.persona === "society"
          ? profile.persona
          : null;

      setAnswers((prev) => ({
        ...prev,
        role: persona,
        state: profile.locationType === "state" ? (profile.locationValue ?? "") : prev.state,
        city: profile.locationType === "city" ? (profile.locationValue ?? "") : prev.city,
        educationLevel: profile.educationLevel ?? "",
        fieldOfStudy: profile.fieldOfStudy ?? "",
        fieldOther: profile.fieldOther ?? "",
        opportunities: profile.opportunityInterests ?? [],
        domains: profile.domainPreferences ?? [],
      }));
      hasHydratedProfile.current = true;
    }
  }, [profileQuery.data]);

  const currentStep = steps[stepIndex];
  const progressValue = Math.round(((stepIndex + 1) / steps.length) * 100);
  const isBusy = isSubmitting || profileQuery.isFetching;

  const updateArray = (field: "opportunities" | "domains", value: string) => {
    setAnswers((prev) => {
      const list = prev[field];
      const exists = list.includes(value);
      const next = exists ? list.filter((item) => item !== value) : [...list, value];
      return { ...prev, [field]: next };
    });
  };

  const handleRoleSelect = (role: Role) => {
    setAnswers((prev) => ({
      ...prev,
      role,
      // Society path: keep it super light; we'll still save interests if they pick.
      educationLevel: role === "student" ? prev.educationLevel : "",
      fieldOfStudy: role === "student" ? prev.fieldOfStudy : "",
      fieldOther: role === "student" ? prev.fieldOther : "",
      state: role === "student" ? prev.state : "",
      city: role === "student" ? prev.city : "",
    }));
  };

  const isComplete = (step: Step) => {
    switch (step.id) {
      case "role":
        return Boolean(answers.role);
      // Everything else is skippable by design.
      default:
        return true;
    }
  };

  const saveProfile = useMutation({
    mutationFn: (payload: SaveOnboardingProfileInput) => saveOnboardingProfile(payload),
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "Failed to save preferences");
    },
    onSuccess: () => {
      toast.success("Saved. Welcome in.");
      router.push("/opportunities");
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const goNext = async () => {
    const trimmedState = answers.state.trim();
    const trimmedCity = answers.city.trim();
    const locationValue = trimmedState ? trimmedState : trimmedCity;
    const locationType = trimmedState ? "state" : "city";

    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
  };

  const goBack = () => {
    if (stepIndex > 0 && !isSubmitting) {
      setStepIndex((i) => i - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isComplete(currentStep) && !isBusy) {
      goNext();
    }
  };

  const handleFieldSelect = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      fieldOfStudy: value,
      fieldOther: value === "Other" ? prev.fieldOther : "",
    }));
  };

  const SWIPE_THRESHOLD = 90;

  const canGoNext = isComplete(currentStep) && !isBusy;
  const canGoBack = stepIndex > 0 && !isSubmitting;

  const handleSwipeEnd = (_e: unknown, info: { offset: { x: number; y: number } }) => {
    if (isBusy) return;
    const x = info?.offset?.x ?? 0;

    // Swipe left => next
    if (x <= -SWIPE_THRESHOLD) {
      if (canGoNext) goNext();
      return;
    }

    // Swipe right => back
    if (x >= SWIPE_THRESHOLD) {
      if (canGoBack) goBack();
    }
  };

  const questLabel = useMemo(() => {
    // tiny gamification, no cringe.
    return `Quest ${stepIndex + 1} / ${steps.length}`;
  }, [stepIndex, steps.length]);

  return (
    <div className="h-full grow bg-[radial-gradient(60%_40%_at_50%_0%,rgba(251,146,60,0.25),transparent_60%),linear-gradient(to_bottom,#fff7ed,white)]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/images/fire-logo.png"
            alt="Fire in the Belly Logo"
            width={72}
            height={72}
            className="mb-3 object-contain"
          />

          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-white/70 px-3 py-1 text-xs text-orange-800 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium">{questLabel}</span>
            <span className="text-orange-500/80">•</span>
            <span className="text-orange-700/80">~1 min</span>
          </div>

          <h1 className="text-3xl leading-tight font-semibold text-balance text-gray-900 md:text-4xl">
            Set up your feed — stress-free
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            This is for students. Pick what feels right and we’ll surface internships, scholarships, and resources that match.
            You can skip anything and edit later.
          </p>

          <div className="flex w-full max-w-xl items-center gap-3">
            <Progress value={progressValue} className="h-2 flex-1" />
            <span className="text-sm font-medium text-gray-700">{questLabel}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <Card className="border-orange-100/60 bg-white/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle>{currentStep.title}</CardTitle>
              <CardDescription>{currentStep.description}</CardDescription>
              <div className="mt-2 text-xs text-orange-700/80">
                Tip: swipe left/right to move between cards.
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep.id}
                  {...stepAnim}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.12}
                  onDragEnd={handleSwipeEnd}
                  whileDrag={{ scale: 0.99, rotate: -0.25 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="space-y-6 touch-pan-y"
                >
                  {currentStep.id === "role" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <OptionCard
                        title="Student"
                        description="I’m here to find opportunities + get unstuck."
                        selected={answers.role === "student"}
                        onClick={() => handleRoleSelect("student")}
                        onKeyDown={handleKeyDown}
                        disabled={isBusy}
                        autoFocus
                      />
                      <OptionCard
                        title="Society member"
                        description="I share opportunities / run events for students."
                        selected={answers.role === "society"}
                        onClick={() => handleRoleSelect("society")}
                        onKeyDown={handleKeyDown}
                        disabled={isBusy}
                      />
                    </div>
                  )}

                  {currentStep.id === "basics" && (
                    <div className="space-y-5">
                      {answers.role !== "student" ? (
                        <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-4 text-sm text-orange-900">
                          <div className="font-medium">Quick note</div>
                          <div className="mt-1 text-orange-800/80">
                            This flow is optimized for students. You can still pick interests on the next step.
                          </div>
                        </div>
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">State (optional)</label>
                          <select
                            value={answers.state}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, state: e.target.value }))}
                            onKeyDown={handleKeyDown}
                            className="flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isBusy}
                          >
                            <option value="">Select</option>
                            {stateOptions.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                          <p className="text-muted-foreground text-xs">Helps us show nearby events & campus programs.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">City (optional)</label>
                          <Input
                            placeholder="e.g. Pune"
                            value={answers.city}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, city: e.target.value }))}
                            onKeyDown={handleKeyDown}
                            className="h-11"
                            disabled={isBusy}
                          />
                          <p className="text-muted-foreground text-xs">If you skip this, no problem.</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-800">Education (optional)</div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {educationLevels.map((level) => (
                            <SelectableButton
                              key={level}
                              label={level}
                              selected={answers.educationLevel === level}
                              onClick={() => setAnswers((prev) => ({ ...prev, educationLevel: level }))}
                              onKeyDown={handleKeyDown}
                              disabled={isBusy}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-800">Field (optional)</div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {fieldOptions.map((field) => (
                            <SelectableButton
                              key={field}
                              label={field}
                              selected={answers.fieldOfStudy === field}
                              onClick={() => handleFieldSelect(field)}
                              onKeyDown={handleKeyDown}
                              disabled={isBusy}
                            />
                          ))}
                        </div>
                        {answers.fieldOfStudy === "Other" ? (
                          <Input
                            placeholder="Add your field"
                            value={answers.fieldOther}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, fieldOther: e.target.value }))}
                            onKeyDown={handleKeyDown}
                            disabled={isBusy}
                          />
                        ) : null}
                      </div>
                    </div>
                  )}

                  {currentStep.id === "interests" && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-800">Pick what you want right now</div>
                            <div className="text-xs text-muted-foreground">A few picks is perfect.</div>
                          </div>
                          <div className="text-xs text-neutral-500">Selected: {answers.opportunities.length}</div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {opportunityOptions.map((item) => (
                            <SelectableButton
                              key={item}
                              label={item}
                              selected={answers.opportunities.includes(item)}
                              onClick={() => updateArray("opportunities", item)}
                              onKeyDown={handleKeyDown}
                              icon={answers.opportunities.includes(item) ? <Check /> : undefined}
                              disabled={isBusy}
                            />
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-800">Topics you like (optional)</div>
                            <div className="text-xs text-muted-foreground">This shapes your feed.</div>
                          </div>
                          <div className="text-xs text-neutral-500">Selected: {answers.domains.length}</div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {domainOptions.map((item) => (
                            <SelectableButton
                              key={item}
                              label={item}
                              selected={answers.domains.includes(item)}
                              onClick={() => updateArray("domains", item)}
                              onKeyDown={handleKeyDown}
                              icon={answers.domains.includes(item) ? <Check /> : undefined}
                              disabled={isBusy}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep.id === "wrap" && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/60 p-4 text-sm text-gray-800">
                        <p className="font-medium text-orange-700">All set.</p>
                        <p className="text-muted-foreground mt-1">
                          We’ll personalize your feed based on these signals. You can edit anytime from your profile.
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <SummaryItem title="Role" value={answers.role ? titleCase(answers.role) : "Not set"} />
                        <SummaryItem
                          title="Location"
                          value={
                            answers.state.trim() || answers.city.trim()
                              ? (answers.state.trim() ? answers.state.trim() : answers.city.trim())
                              : "Skipped"
                          }
                        />
                        <SummaryItem title="Education" value={answers.educationLevel || "Skipped"} />
                        <SummaryItem
                          title="Field"
                          value={
                            answers.fieldOfStudy === "Other"
                              ? answers.fieldOther || "Skipped"
                              : answers.fieldOfStudy || "Skipped"
                          }
                        />
                        <SummaryItem title="Wants" value={pickLabel(answers.opportunities)} />
                        <SummaryItem title="Topics" value={pickLabel(answers.domains)} />
                        <SummaryList title="Opportunities" items={answers.opportunities} />
                        <SummaryList title="Domains" items={answers.domains} />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
            <Separator />
            <div className="flex items-center justify-between px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={stepIndex === 0 || isSubmitting}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>

              <div className="flex items-center gap-3">
                {currentStep.id !== "wrap" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goNext}
                    disabled={isBusy || !isComplete(currentStep)}
                  >
                    Skip
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="primary"
                  onClick={goNext}
                  disabled={!isComplete(currentStep) || isBusy}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving
                    </>
                  ) : (
                    <>
                      {stepIndex === steps.length - 1 ? "Start" : "Continue"}{" "}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="max-h-[600px] overflow-y-auto border-orange-100/60 bg-white/70 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>Just a quick glance at what we’ll use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <PreviewItem label="Role" value={answers.role ? titleCase(answers.role) : "—"} />
              <PreviewItem
                label="Location"
                value={
                  answers.state.trim() || answers.city.trim()
                    ? (answers.state.trim() ? answers.state.trim() : answers.city.trim())
                    : "—"
                }
              />
              <PreviewItem label="Education" value={answers.educationLevel || "—"} />
              <PreviewItem
                label="Field"
                value={
                  answers.fieldOfStudy === "Other"
                    ? answers.fieldOther || "—"
                    : answers.fieldOfStudy || "—"
                }
              />
              <PreviewList label="Wants" items={answers.opportunities} />
              <PreviewList label="Topics" items={answers.domains} />

              {answers.role === "society" ? (
                <div className="rounded-md bg-orange-50 p-3 text-xs text-orange-700">
                  Tip: switch to Student if you want student-tailored recommendations.
                </div>
              ) : null}

              <Separator />
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>{profileQuery.isFetching ? "Loading…" : "Ready when you are"}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span>Saved to your profile</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
