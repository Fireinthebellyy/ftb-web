"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

// interface SprintSession {
//   id: string;
//   title: string;
//   description: string;
// }

export default function SprintRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const sprintId = params.id as string;
  const { data: session, isPending: sessionPending } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sprintTitle, setSprintTitle] = useState("");
  const [_toolkitId, setToolkitId] = useState<string | null>(null);

  // const [sessions, setSessions] = useState<SprintSession[]>([]);
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [mobileNumber,setMobileNumber] = useState("+91 ");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [city,setCity] = useState("");
  const [expectations, setExpectations] = useState("");
  const [consent,setConsent] = useState(false);
  const [showRegistration,setShowRegistration]= useState(true);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  // const [showSessionSelectionDialog, setShowSessionSelectionDialog] = useState(false);
  // const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  // const [isSubmittingSessions, setIsSubmittingSessions] = useState(false);

  const fetchRegistrationStatus = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);

    try {
      const response = await axios.get(`/api/sprints/${sprintId}/registration`);
      const data = response.data;

      setSprintTitle(data.sprintTitle);
      setToolkitId(data.toolkitId ?? null);
      // setSessions(data.sessions || []);

      if (data.completed) {
        if (data.toolkitId) {
          router.replace(`/toolkit/${data.toolkitId}/content`);
        } else {
          router.replace(`/toolkit/sprints/${sprintId}/dashboard`);
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
  }, [sprintId, router]);

  useEffect(() => {
    if (sessionPending) {
      return;
    }

    if (!session) {
      router.replace(`/login?returnUrl=%2Ftoolkit%2Fsprints%2F${sprintId}%2Fregistration`);
      return;
    }

    fetchRegistrationStatus();
  }, [sprintId, fetchRegistrationStatus, router, session, sessionPending]);

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

    try {
      const response = await axios.post(`/api/sprints/${sprintId}/registration`, {
        name: name.trim(),
        mobileNumber,
        college: college.trim(),
        course: course.trim(),
        year,
        city: city.trim(),
        expectations: expectations.trim(),
        consent
      });

      // If registration is complete (no active sessions to select)
      if (response.data.registrationComplete) {
        toast.success("Registration complete! Welcome to the sprint.");
        if (response.data.isVerificationRequired) {
          setShowVerificationDialog(true);
        } else if (response.data.toolkitId) {
          router.replace(`/toolkit/${response.data.toolkitId}/content`);
        } else {
          router.replace(`/toolkit/sprints/${sprintId}/dashboard`);
        }
        return;
      }

      // //Show session selection dialog if there are sessions
      // setShowSessionSelectionDialog(true);
      setShowRegistration(false);
      setShowVerificationDialog(true);
      setIsSubmitting(true);
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

  // const handleSessionSubmit = async () => {
  //   if (selectedSessionIds.length === 0) {
  //     toast.error("Please select at least one session");
  //     return;
  //   }

  //   setIsSubmittingSessions(true);
  //   try {
  //     await axios.post(`/api/sprints/${sprintId}/registration/sessions`, {
  //       selectedSessionIds,
  //     });

  //     const sprintResponse = await axios.get(`/api/sprints/${sprintId}/registration`);
  //     if (sprintResponse.data.isVerificationRequired) {
  //       setShowSessionSelectionDialog(false);
  //       setShowVerificationDialog(true);
  //     } else {
  //       toast.success("Sessions selected! Welcome to the sprint.");
  //       if (_toolkitId) {
  //         router.replace(`/toolkit/${_toolkitId}/content`);
  //       } else {
  //         router.replace(`/toolkit/sprints/${sprintId}/dashboard`);
  //       }
  //     }
  //   } catch (error: unknown) {
  //     console.error(error);
  //     const message =
  //       axios.isAxiosError(error) && error.response?.data?.error
  //         ? error.response.data.error
  //         : "Failed to save sessions";
  //     toast.error(message);
  //   } finally {
  //     setIsSubmittingSessions(false);
  //   }
  // };

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
    <>
      {showRegistration && <div className="min-h-screen bg-neutral-50 px-4 py-10">
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
                Payment successful for <strong>{sprintTitle}</strong>. Please complete
                this form to access your sprint and toolkit.
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
                <Label htmlFor="college">College / University</Label>
                <Input
                  id="college"
                  value={college}
                  onChange={(event) => setCollege(event.target.value)}
                  placeholder="Your college / university"
                  required
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number(Whatsapp)</Label>
                <Input
                  id="mobileNumber"
                  value={mobileNumber}
                  onChange={(event) => setMobileNumber(event.target.value)}
                  placeholder="Your Mobile Number"
                  required
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="course">Degree / Course</Label>
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
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Your City"
                  required
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="expectations">
                  What are you expecting from this sprint &amp; sessions (we are all ears &lt;3)?
                </Label>
                <Textarea
                  id="expectations"
                  value={expectations}
                  onChange={(event) => setExpectations(event.target.value)}
                  placeholder="Share your goals, expectations, or questions..."
                  rows={4}
                  className="md:min-h-[8rem]"
                  required
                />
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 md:p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-neutral-300 accent-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
                    required
                  />

                  <Label
                    htmlFor="consent"
                    className="cursor-pointer text-sm font-medium leading-5 text-[#c2410c] md:text-base md:leading-6"
                  >
                    I consent to actively participate throughout the sprint and share a
                    testimonial/feedback with the team after the sprint is completed.
                  </Label>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 w-full bg-neutral-900 text-sm font-semibold hover:bg-neutral-800 md:h-12 md:text-base text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue to Sprint"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>}

      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Lock className="h-6 w-6 text-[#ff5e14]" />
              </div>

              <span>Access Coming Soon</span>
            </DialogTitle>

            <DialogDescription className="pt-3 text-center text-gray-600">
              <span className="block">
                You will get access to the dashboard and be added to our exclusive
                Marketing Sprint WhatsApp community
              </span>

              <span className="mt-1 block">
                by{" "}
                <span className="font-semibold text-[#ff5e14]">
                  1st October
                </span>
                .
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-4 w-full">
            <Button className="w-full max-w-md p-0 overflow-hidden">
            <a
            href={`https://wa.me/916377492042?text=Hi!%20I have%20joined%20the cohort and would like to%20enquire%20about%20the%20sprint%20program:%20${encodeURIComponent(sprintTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm md:text-base py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0 md:w-5 md:h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.808 1.236h.005c5.505 0 9.99-4.477 9.99-9.985C22.005 6.478 17.518 2 12.012 2Zm5.845 14.285c-.244.686-1.42 1.328-1.948 1.41-.478.077-1.101.144-3.187-.723-2.667-1.108-4.37-3.816-4.502-3.992-.133-.176-1.077-1.43-1.077-2.729 0-1.298.679-1.937.922-2.202.244-.265.533-.332.71-.332.178 0 .356.006.51.013.162.008.38-.06.593.453.22.532.753 1.836.82 1.968.067.133.11.288.022.465-.088.177-.133.288-.266.443-.133.155-.28.347-.4.493-.133.16-.272.336-.117.6.155.265.686 1.132 1.47 1.831.99.885 1.823 1.157 2.08 1.288.254.133.403.11.553-.066.15-.177.643-.753.815-.996.172-.244.344-.2.58-.112.235.088 1.492.703 1.748.83.256.128.427.194.49.305.061.11.061.643-.183 1.329Z" />
            </svg>
            Directly Connect With The Team
          </a>
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="w-full max-w-xs bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              Back to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* <Dialog open={showSessionSelectionDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl">
              Which session(s) do you wish to attend?
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              Select the sessions you want to attend from the list below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No sessions available</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    setSelectedSessionIds(prev =>
                      prev.includes(session.id)
                        ? prev.filter(id => id !== session.id)
                        : [...prev, session.id]
                    );
                  }}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                    selectedSessionIds.includes(session.id)
                      ? "border-[#ff5e14] bg-orange-50/10"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSessionIds.includes(session.id)}
                      onChange={() => {}}
                      className="mt-1 rounded border-gray-300 text-[#ff5e14] focus:ring-[#ff5e14]"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{session.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleSessionSubmit}
              disabled={isSubmittingSessions || (sessions.length > 0 && selectedSessionIds.length === 0)}
              className="w-full max-w-xs bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              {isSubmittingSessions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue to Dashboard"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}
    </>
  );
}
