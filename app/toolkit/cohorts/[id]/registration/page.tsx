"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-session";

const yearOptions = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Graduate",
  "Working Professional",
  "Other",
];

export default function CohortRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const cohortId = params.id as string;
  const { data: session, isPending: sessionPending } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cohortTitle, setCohortTitle] = useState("");
  const [_toolkitId, _setToolkitId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [expectations, setExpectations] = useState("");

  const fetchRegistrationStatus = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);

    try {
      const response = await axios.get(`/api/cohorts/${cohortId}/registration`);
      const data = response.data;

      setCohortTitle(data.cohortTitle);
      _setToolkitId(data.toolkitId ?? null);

      if (data.completed) {
        if (data.toolkitId) {
          router.replace(`/toolkit/${data.toolkitId}/content`);
        } else {
          // Redirect to cohort dashboard if no toolkit id
          router.replace(`/toolkit/cohorts/${cohortId}/dashboard`);
        }
        return;
      }

      if (data.prefilledName) {
        setName(data.prefilledName);
      }
    } catch (error: unknown) {
      console.error(error);
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Unable to load registration form";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [cohortId, router]);

  useEffect(() => {
    if (sessionPending) {
      return;
    }

    if (!session) {
      router.replace(`/login?returnUrl=%2Ftoolkit%2Fcohorts%2F${cohortId}%2Fregistration`);
      return;
    }

    fetchRegistrationStatus();
  }, [cohortId, fetchRegistrationStatus, router, session, sessionPending]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !college.trim() || !course.trim() || !year || !expectations.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`/api/cohorts/${cohortId}/registration`, {
        name: name.trim(),
        college: college.trim(),
        course: course.trim(),
        year,
        expectations: expectations.trim(),
      });

      toast.success("Details saved! Welcome to the cohort.");
      router.replace(`/toolkit/cohorts/${cohortId}/dashboard`);
    } catch (error: unknown) {
      console.error(error);
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to submit form";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff5e14]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-neutral-600">{loadError}</p>
          <Button
            onClick={fetchRegistrationStatus}
            className="mt-4 bg-neutral-900 hover:bg-neutral-800"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ff5e14] md:text-xs">
              One last step
            </p>
            <h1 className="mt-2 text-xl font-bold text-neutral-900 md:text-3xl">
              Tell us about yourself
            </h1>
            <p className="mt-2 text-xs text-neutral-600 md:text-base">
              Payment successful for <strong>{cohortTitle}</strong>. Please complete
              this form to access your cohort and toolkit.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="college">College</Label>
              <Input
                id="college"
                value={college}
                onChange={(event) => setCollege(event.target.value)}
                placeholder="Your college / university"
                required
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                placeholder="e.g. B.Tech CSE, BBA, MBA"
                required
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear} required>
                <SelectTrigger id="year" className="w-full">
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="expectations">
                What are you expecting from this cohort &amp; sessions (we are all
                ears &lt;3)?
              </Label>
              <Textarea
                id="expectations"
                value={expectations}
                onChange={(event) => setExpectations(event.target.value)}
                placeholder="Share your goals, expectations, or questions..."
                rows={4}
                className="md:!rows-5"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full bg-neutral-900 text-sm font-semibold hover:bg-neutral-800 md:h-12 md:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue to Cohort"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
