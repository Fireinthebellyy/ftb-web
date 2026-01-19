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
  struggleOptions,
} from "@/app/onboarding/constants";
import {
  fetchOnboardingProfile,
  OnboardingProfile,
  saveOnboardingProfile,
  SaveOnboardingProfileInput,
} from "@/lib/queries";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
  locationType: "city" | "state";
  locationValue: string;
  state: string;
  city: string;
  educationLevel: string;
  fieldOfStudy: string;
  fieldOther: string;
  opportunities: string[];
  domains: string[];
  struggles: string[];
};

type Step =
  | { id: "role"; title: string; description: string }
  | { id: "location"; title: string; description: string }
  | { id: "education"; title: string; description: string }
  | { id: "field"; title: string; description: string }
  | { id: "opportunities"; title: string; description: string }
  | { id: "domains"; title: string; description: string }
  | { id: "struggles"; title: string; description: string }
  | { id: "wrap"; title: string; description: string };

function titleCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    role: null,
    locationType: "city",
    locationValue: "",
    state: "",
    city: "",
    educationLevel: "",
    fieldOfStudy: "",
    fieldOther: "",
    opportunities: [],
    domains: [],
    struggles: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: Step[] = useMemo(() => {
    const base: Step[] = [
      {
        id: "role",
        title: "Who are you?",
        description: "We will personalise the journey based on your role.",
      },
    ];

    if (answers.role === "student") {
      base.push(
        {
          id: "location",
          title: "Where are you based?",
          description:
            "City or state helps us surface nearby and remote options.",
        },
        {
          id: "education",
          title: "Current education level",
          description: "So we can suggest the right kind of guidance.",
        },
        {
          id: "field",
          title: "Field of study",
          description: "Pick what best matches you. Add other if we missed it.",
        },
        {
          id: "opportunities",
          title: "What do you want to find?",
          description: "Select all that excite you right now.",
        },
        {
          id: "domains",
          title: "Preferred domains & topics",
          description: "Tell us what you want your feed to highlight.",
        },
        {
          id: "struggles",
          title: "What do you struggle with?",
          description: "We'll send you tips and templates that unblock you.",
        }
      );
    }

    base.push({
      id: "wrap",
      title: "All set",
      description: "Review and finish to get your tailored feed.",
    });
    return base;
  }, [answers.role]);

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
        locationType: profile.locationType === "state" ? "state" : "city",
        locationValue: profile.locationValue ?? "",
        educationLevel: profile.educationLevel ?? "",
        fieldOfStudy: profile.fieldOfStudy ?? "",
        fieldOther: profile.fieldOther ?? "",
        opportunities: profile.opportunityInterests ?? [],
        domains: profile.domainPreferences ?? [],
        struggles: profile.struggles ?? [],
      }));
      hasHydratedProfile.current = true;
    }
  }, [profileQuery.data]);

  const currentStep = steps[stepIndex];
  const progressValue = Math.round(((stepIndex + 1) / steps.length) * 100);
  const isBusy = isSubmitting || profileQuery.isFetching;

  const updateArray = (field: keyof Answers, value: string) => {
    setAnswers((prev) => {
      const list = prev[field] as string[];
      if (!Array.isArray(list)) return prev;
      const exists = list.includes(value);
      const next = exists
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...prev, [field]: next };
    });
  };

  const handleRoleSelect = (role: Role) => {
    setAnswers((prev) => ({
      role,
      locationType: role === "student" ? prev.locationType : "city",
      locationValue: role === "student" ? prev.locationValue : "",
      state: role === "student" ? prev.state : "",
      city: role === "student" ? prev.city : "",
      educationLevel: role === "student" ? prev.educationLevel : "",
      fieldOfStudy: role === "student" ? prev.fieldOfStudy : "",
      fieldOther: role === "student" ? prev.fieldOther : "",
      opportunities: role === "student" ? prev.opportunities : [],
      domains: role === "student" ? prev.domains : [],
      struggles: role === "student" ? prev.struggles : [],
    }));
    if (role === "society") {
      setStepIndex((prev) => Math.min(prev, 1));
    }
  };

  const isComplete = (step: Step) => {
    switch (step.id) {
      case "role":
        return Boolean(answers.role);
      case "location":
        return answers.locationValue.trim().length > 1;
      case "education":
        return Boolean(answers.educationLevel);
      case "field":
        if (answers.fieldOfStudy === "Other") {
          return answers.fieldOther.trim().length > 1;
        }
        return Boolean(answers.fieldOfStudy);
      case "opportunities":
        return answers.opportunities.length > 0;
      case "domains":
        return answers.domains.length > 0;
      case "struggles":
        return answers.struggles.length > 0;
      case "wrap":
      default:
        return true;
    }
  };

  const saveProfile = useMutation({
    mutationFn: (payload: SaveOnboardingProfileInput) =>
      saveOnboardingProfile(payload),
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "Failed to save preferences");
    },
    onSuccess: () => {
      toast.success("Preferences saved");
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
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      if (!answers.role) return;
      await saveProfile.mutateAsync({
        persona: answers.role,
        locationType:
          answers.role === "student" ? answers.locationType : undefined,
        locationValue:
          answers.role === "student" ? answers.locationValue : undefined,
        educationLevel:
          answers.role === "student" ? answers.educationLevel : undefined,
        fieldOfStudy:
          answers.role === "student" ? answers.fieldOfStudy : undefined,
        fieldOther:
          answers.role === "student" && answers.fieldOfStudy === "Other"
            ? answers.fieldOther
            : undefined,
        opportunityInterests:
          answers.role === "student" ? answers.opportunities : [],
        domainPreferences: answers.role === "student" ? answers.domains : [],
        struggles: answers.role === "student" ? answers.struggles : [],
      });
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

  return (
    <div className="h-full grow bg-gradient-to-b from-neutral-50 via-orange-50/40 to-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/images/fire-logo.png"
            alt="Fire in the Belly Logo"
            width={80}
            height={80}
            className="mb-4 object-contain"
          />
          <h1 className="text-3xl leading-tight font-semibold text-balance text-gray-900 md:text-4xl">
            Let&apos;s personalise your opportunities
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            Answer a few quick questions so we can surface the right
            internships, scholarships, and resources before anyone else.
          </p>
          <div className="flex w-full max-w-xl items-center gap-3">
            <Progress value={progressValue} className="h-2 flex-1" />
            <span className="text-sm font-medium text-gray-700">
              Step {stepIndex + 1} / {steps.length}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <Card className="border-orange-100/60 bg-white/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle>{currentStep.title}</CardTitle>
              <CardDescription>{currentStep.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep.id}
                  {...stepAnim}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {currentStep.id === "role" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <OptionCard
                        title="Student"
                        description="Looking for internships, scholarships, or competitions."
                        selected={answers.role === "student"}
                        onClick={() => handleRoleSelect("student")}
                        onKeyDown={handleKeyDown}
                        disabled={isBusy}
                        autoFocus
                      />
                      <OptionCard
                        title="Society member"
                        description="Curating opportunities or planning events for students."
                        selected={answers.role === "society"}
                        onClick={() => handleRoleSelect("society")}
                        onKeyDown={handleKeyDown}
                        disabled={isBusy}
                      />
                    </div>
                  )}

                  {currentStep.id === "location" && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                          State
                        </label>
                        <select
                          value={answers.state}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              state: e.target.value,
                              locationType: "state",
                              locationValue: e.target.value,
                            }))
                          }
                          onKeyDown={handleKeyDown}
                          className="flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isBusy}
                        >
                          <option value="">Select your state</option>
                          {stateOptions.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                          City (optional)
                        </label>
                        <Input
                          placeholder="Enter your city"
                          value={answers.city}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              city: e.target.value,
                              locationType: "city",
                              locationValue: e.target.value,
                            }))
                          }
                          onKeyDown={handleKeyDown}
                          className="h-11"
                          disabled={isBusy}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Select your state first, then optionally add your city.
                        This helps us surface nearby events and remote-friendly
                        options.
                      </p>
                    </div>
                  )}

                  {currentStep.id === "education" && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {educationLevels.map((level) => (
                        <SelectableButton
                          key={level}
                          label={level}
                          selected={answers.educationLevel === level}
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              educationLevel: level,
                            }))
                          }
                          onKeyDown={handleKeyDown}
                          disabled={isBusy}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep.id === "field" && (
                    <div className="space-y-4">
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
                      {answers.fieldOfStudy === "Other" && (
                        <Input
                          placeholder="Add your field"
                          value={answers.fieldOther}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              fieldOther: e.target.value,
                            }))
                          }
                          onKeyDown={handleKeyDown}
                          disabled={isBusy}
                        />
                      )}
                    </div>
                  )}

                  {currentStep.id === "opportunities" && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {opportunityOptions.map((item) => (
                        <SelectableButton
                          key={item}
                          label={item}
                          selected={answers.opportunities.includes(item)}
                          onClick={() => updateArray("opportunities", item)}
                          onKeyDown={handleKeyDown}
                          icon={
                            answers.opportunities.includes(item) ? (
                              <Check />
                            ) : undefined
                          }
                          disabled={isBusy}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep.id === "domains" && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {domainOptions.map((item) => (
                        <SelectableButton
                          key={item}
                          label={item}
                          selected={answers.domains.includes(item)}
                          onClick={() => updateArray("domains", item)}
                          onKeyDown={handleKeyDown}
                          icon={
                            answers.domains.includes(item) ? (
                              <Check />
                            ) : undefined
                          }
                          disabled={isBusy}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep.id === "struggles" && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {struggleOptions.map((item) => (
                        <SelectableButton
                          key={item}
                          label={item}
                          selected={answers.struggles.includes(item)}
                          onClick={() => updateArray("struggles", item)}
                          onKeyDown={handleKeyDown}
                          icon={
                            answers.struggles.includes(item) ? (
                              <Check />
                            ) : undefined
                          }
                          disabled={isBusy}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep.id === "wrap" && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/60 p-4 text-sm text-gray-800">
                        <p className="font-medium text-orange-700">
                          You&apos;re set!
                        </p>
                        <p className="text-muted-foreground mt-1">
                          We&apos;ll tune your feed to match these picks. You
                          can always edit them later from settings.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <SummaryItem
                          title="Role"
                          value={
                            answers.role ? titleCase(answers.role) : "Not set"
                          }
                        />
                        {answers.role === "student" && (
                          <>
                            <SummaryItem
                              title="Location"
                              value={
                                answers.locationValue
                                  ? `${answers.locationValue} (${answers.locationType})`
                                  : "Not set"
                              }
                            />
                            <SummaryItem
                              title="Education"
                              value={answers.educationLevel || "Not set"}
                            />
                            <SummaryItem
                              title="Field"
                              value={
                                answers.fieldOfStudy === "Other"
                                  ? answers.fieldOther || "Not set"
                                  : answers.fieldOfStudy || "Not set"
                              }
                            />
                            <SummaryList
                              title="Opportunities"
                              items={answers.opportunities}
                            />
                            <SummaryList
                              title="Domains"
                              items={answers.domains}
                            />
                            <SummaryList
                              title="Struggles"
                              items={answers.struggles}
                            />
                          </>
                        )}
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
                <span className="text-muted-foreground text-sm">
                  {isComplete(currentStep)
                    ? "Looks good"
                    : "Answer to continue"}
                </span>
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
                      {stepIndex === steps.length - 1 ? "Finish" : "Continue"}{" "}
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
              <CardDescription>
                Your picks refresh here so you always know what&apos;s set.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <PreviewItem
                label="Role"
                value={answers.role ? titleCase(answers.role) : "--"}
              />
              {answers.role === "student" && (
                <>
                  <PreviewItem
                    label="Location"
                    value={
                      answers.locationValue
                        ? `${answers.locationValue} (${answers.locationType})`
                        : "--"
                    }
                  />
                  <PreviewItem
                    label="Education"
                    value={answers.educationLevel || "--"}
                  />
                  <PreviewItem
                    label="Field"
                    value={
                      answers.fieldOfStudy === "Other"
                        ? answers.fieldOther || "--"
                        : answers.fieldOfStudy || "--"
                    }
                  />
                  <PreviewList
                    label="Opportunities"
                    items={answers.opportunities}
                  />
                  <PreviewList label="Domains" items={answers.domains} />
                  <PreviewList label="Struggles" items={answers.struggles} />
                </>
              )}
              {answers.role === "society" && (
                <div className="rounded-md bg-orange-50 p-3 text-xs text-orange-700">
                  Want student questions? Switch to Student above to unlock the
                  full flow.
                </div>
              )}
              <Separator />
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>
                  {profileQuery.isFetching
                    ? "Loading your picks..."
                    : "Ready when you are"}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />{" "}
                  Saved to your profile
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
