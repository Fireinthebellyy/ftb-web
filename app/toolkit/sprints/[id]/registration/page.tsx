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

export default function SprintRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const sprintId = params.id as string;
  const { data: session, isPending: sessionPending } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sprintTitle, setSprintTitle] = useState("");

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [expectations, setExpectations] = useState("");

  const fetchRegistrationStatus = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);

    try {
      const response = await axios.get(`/api/sprints/${sprintId}/registration`);
      const data = response.data;

      setSprintTitle(data.sprintTitle);

      if (data.completed) {
        router.replace(`/toolkit/sprints/${sprintId}/dashboard`);
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
  }, [sprintId, router]);

  useEffect(() => {
    if (!sessionPending) {
      if (!session?.user) {
        router.replace(`/login?redirectTo=/toolkit/sprints/${sprintId}/registration`);
        return;
      }
      fetchRegistrationStatus();
    }
  }, [sessionPending, session, sprintId, router, fetchRegistrationStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !college.trim() || !course.trim() || !year || !expectations.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`/api/sprints/${sprintId}/registration`, {
        name: name.trim(),
        college: college.trim(),
        course: course.trim(),
        year,
        expectations: expectations.trim(),
      });

      toast.success("Registration completed!");
      router.replace(`/toolkit/sprints/${sprintId}/dashboard`);
    } catch (error: unknown) {
      console.error(error);
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to submit registration";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionPending || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 gap-4">
        <h2 className="text-xl font-bold text-red-400">{loadError}</h2>
        <Button onClick={() => router.push(`/toolkit/sprints/${sprintId}`)} className="bg-orange-600 hover:bg-orange-700">
          Return to Sprint
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-white">Complete Sprint Registration</h1>
          <p className="text-xs text-zinc-400">{sprintTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-300">Full Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="bg-zinc-950 border-zinc-800 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-zinc-300">College / Institution *</Label>
            <Input
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="College name"
              className="bg-zinc-950 border-zinc-800 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Degree / Course *</Label>
              <Input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. B.Tech / BBA"
                className="bg-zinc-950 border-zinc-800 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Year of Study *</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-sm">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-zinc-300">What do you hope to get out of this sprint? *</Label>
            <Textarea
              value={expectations}
              onChange={(e) => setExpectations(e.target.value)}
              placeholder="Share your goals and expectations..."
              className="bg-zinc-950 border-zinc-800 text-sm min-h-[100px]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-bold py-3 text-sm rounded-xl"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Registration & Access Sprint"}
          </Button>
        </form>
      </div>
    </div>
  );
}
