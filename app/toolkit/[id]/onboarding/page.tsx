"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, notFound } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const STREAM_OPTIONS = ["Med", "Non Med", "Commerce", "Arts"];
const FUTURE_OPTIONS = [
  "Btech", "BCA", "CA", "LLB", "Bpharma", "Bsc",
  "MBBS", "BBA", "BCom", "BA", "BArch", "NDA", "UPSC",
  "Design", "Hotel Management", "Journalism", "Fashion Design",
  "Event Management", "Aviation", "Psychology", "Animation"
];

export default function CohortOnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const toolkitId = params.id as string;
  const { data: session, isPending: sessionPending } = useSession();

  const [stream, setStream] = useState("");
  const [selectedFutures, setSelectedFutures] = useState<string[]>([]);
  const [customFuture, setCustomFuture] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (sessionPending) return;
    if (!session) {
      router.replace(`/login?returnUrl=%2Ftoolkit%2F${toolkitId}%2Fonboarding`);
      return;
    }

    const fetchCohortDetails = async () => {
      try {
        // Check if user already onboarding, and load toolkit
        const onboardingRes = await axios.get(`/api/cohorts/onboarding?toolkitId=${toolkitId}`);
        if (onboardingRes.data.onboarding) {
          router.replace(`/toolkit/${toolkitId}/cohort-dashboard`);
          return;
        }

        const toolkit = onboardingRes.data.toolkit;
        if (!toolkit || !toolkit.isCohort) {
          setIsNotFound(true);
          return;
        }

        // Fetch mentor details based on mentorIds in cohortDetails
        if (toolkit.cohortDetails?.mentorIds) {
          const mentorIds = toolkit.cohortDetails.mentorIds;
          const mentorsRes = await axios.get("/api/mentors");
          const filteredMentors = mentorsRes.data.filter((m: any) => mentorIds.includes(m.id));
          setMentors(filteredMentors);
        }
      } catch (error) {
        console.error("Failed to load cohort details", error);
        setIsNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCohortDetails();
  }, [toolkitId, session, sessionPending, router]);

  const toggleFutureOption = (option: string) => {
    setSelectedFutures(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stream) {
      toast.error("Please select a stream.");
      return;
    }
    if (!selectedMentor) {
      toast.error("Please select a mentor.");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post("/api/cohorts/onboarding", {
        toolkitId,
        stream,
        futureOptions: selectedFutures,
        customOptions: customFuture,
        mentorId: selectedMentor,
        customAnswers: {} // To implement custom questions if needed
      });
      
      toast.success("Welcome to the cohort!");
      router.push(`/toolkit/${toolkitId}/cohort-dashboard`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isNotFound) {
    notFound();
  }

  if (loading || sessionPending) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to your Cohort!</h1>
            <p className="text-gray-500 mt-2">Let&apos;s personalize your experience.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Stream Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">1. What is your current stream?</h3>
              <RadioGroup value={stream} onValueChange={setStream} className="grid grid-cols-2 gap-4">
                {STREAM_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center space-x-2 border rounded-md p-4">
                    <RadioGroupItem value={opt} id={`stream-${opt}`} />
                    <Label htmlFor={`stream-${opt}`}>{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Future Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">2. What future options are you interested in?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {FUTURE_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`future-${opt}`} 
                      checked={selectedFutures.includes(opt)}
                      onCheckedChange={() => toggleFutureOption(opt)}
                    />
                    <Label htmlFor={`future-${opt}`}>{opt}</Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="custom-future">Other (Max 50 words)</Label>
                <Textarea 
                  id="custom-future"
                  placeholder="Enter any other options..."
                  value={customFuture}
                  onChange={(e) => {
                    if (e.target.value.split(" ").length <= 50) {
                      setCustomFuture(e.target.value);
                    }
                  }}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Mentor Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">3. Choose your Mentor</h3>
              {mentors.length === 0 ? (
                <p className="text-sm text-gray-500">No mentors assigned to this cohort yet.</p>
              ) : (
                <RadioGroup value={selectedMentor} onValueChange={setSelectedMentor} className="grid sm:grid-cols-2 gap-4">
                  {mentors.map((mentor) => (
                    <div key={mentor.id} className="flex items-start space-x-3 border rounded-md p-4">
                      <RadioGroupItem value={mentor.id} id={`mentor-${mentor.id}`} className="mt-1" />
                      <div>
                        <Label htmlFor={`mentor-${mentor.id}`} className="font-semibold">{mentor.mentorName}</Label>
                        <p className="text-sm text-gray-500 mt-1">{mentor.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            {/* Submit */}
            <div className="pt-6 border-t">
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Saving..." : "Enter Cohort"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
