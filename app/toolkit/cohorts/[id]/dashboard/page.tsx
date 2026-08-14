
/* eslint-disable max-lines */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Menu, Lock, Unlock, MessageCircle, Send, Edit, Trash2 } from "lucide-react";
import { cn, stripHtml } from "@/lib/utils";
import {
  useCohortDetail,
  useCohortSession,
} from "@/lib/queries-cohorts";
import { Skeleton } from "@/components/ui/skeleton";
import HtmlRenderer from "@/components/toolkit/HtmlRenderer";
import {
  CohortSessionContent,
  CohortSessionResource,
  CohortSessionMentor,
} from "@/types/interfaces";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { useQuery } from "@tanstack/react-query";

export default function CohortDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const cohortId = params.id as string;

  const getInitialSessionId = (): string | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash.replace("#", "");
    if (hash) return hash;
    try {
      return localStorage.getItem(`cohort:${cohortId}:session`);
    } catch {
      return null;
    }
  };

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    getInitialSessionId
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const { data: cohortData, isLoading: isCohortLoading } =
    useCohortDetail(cohortId);

  const sessions = useMemo(() => cohortData?.sessions ?? [], [cohortData]);

  useEffect(() => {
    if (sessions.length === 0) return;

    const accessibleSessions = sessions.filter((s: any) => s.isAccessible);
    if (accessibleSessions.length === 0) return;

    let targetId: string | null = null;

    if (currentSessionId) {
      const isValid = accessibleSessions.some(
        (s: any) => s.id === currentSessionId
      );
      if (isValid) {
        targetId = currentSessionId;
      }
    }

    if (!targetId) {
      targetId = accessibleSessions[0].id;
      setCurrentSessionId(targetId);
    }

    try {
      localStorage.setItem(`cohort:${cohortId}:session`, targetId);
    } catch {
      /* noop */
    }
    if (typeof window !== "undefined" && window.location.hash !== `#${targetId}`) {
      history.replaceState(null, "", `#${targetId}`);
    }
  }, [sessions, currentSessionId, cohortId]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash !== currentSessionId) {
        const match = sessions.find((s: any) => s.id === hash && s.isAccessible);
        if (match) setCurrentSessionId(hash);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [sessions, currentSessionId]);

  const handleSessionSelect = (id: string) => {
    setCurrentSessionId(id);
    try {
      localStorage.setItem(`cohort:${cohortId}:session`, id);
    } catch {
      /* noop */
    }
    if (typeof window !== "undefined" && window.location.hash !== `#${id}`) {
      history.replaceState(null, "", `#${id}`);
    }
  };

  const { data: sessionData, isLoading: isSessionLoading } = useCohortSession(
    cohortId,
    currentSessionId || ""
  );

  const contents = useMemo(() => sessionData?.contents ?? [], [sessionData]);

  if (isCohortLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!cohortData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-bold">Cohort Not Found</h2>
            <p className="mb-4 text-sm text-gray-600">
              We couldn&apos;t load this cohort.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cohortData.isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Lock className="h-8 w-8 text-orange-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Access Locked</h2>
            <p className="mb-6 text-sm text-gray-600">
              The Cohort will be starting from 15th August, you will get added in our exclusive community by 13th August & the cohort dashboard will unlock within a week.
            </p>
            <Button onClick={() => router.push("/")} className="w-full mb-3">
              Back to Home
            </Button>
            <a
              href="https://wa.me/916377492042?text=Hi%2C%20I%20enrolled%20into%20the%20Cohort%20and%20have%20a%20few%20queries."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.808 1.236h.005c5.505 0 9.99-4.477 9.99-9.985C22.005 6.478 17.518 2 12.012 2Zm5.845 14.285c-.244.686-1.42 1.328-1.948 1.41-.478.077-1.101.144-3.187-.723-2.667-1.108-4.37-3.816-4.502-3.992-.133-.176-1.077-1.43-1.077-2.729 0-1.298.679-1.937.922-2.202.244-.265.533-.332.71-.332.178 0 .356.006.51.013.162.008.38-.06.593.453.22.532.753 1.836.82 1.968.067.133.11.288.022.465-.088.177-.133.288-.266.443-.133.155-.28.347-.4.493-.133.16-.272.336-.117.6.155.265.686 1.132 1.47 1.831.99.885 1.823 1.157 2.08 1.288.254.133.403.11.553-.066.15-.177.643-.753.815-.996.172-.244.344-.2.58-.112.235.088 1.492.703 1.748.83.256.128.427.194.49.305.061.11.061.643-.183 1.329Z" />
                </svg>
                Ask a Query
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="flex h-16 items-center px-4 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-gray-500">
                {cohortData.cohort.title}
              </p>
              <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base sm:break-words">
                {sessionData?.session.title || "Select a session"}
              </h1>
            </div>
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Session Menu</SheetTitle>
                <CohortSessionSidebar
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSessionSelect={(id) => {
                    handleSessionSelect(id);
                    setSidebarOpen(false);
                  }}
                />
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
              className="hidden shrink-0 lg:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetTitle className="sr-only">Session Menu</SheetTitle>
              <CohortSessionSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSessionSelect={(id) => {
                  handleSessionSelect(id);
                  setSidebarOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
            className="hidden shrink-0 lg:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="lg:flex">
        <main
          className="flex-1 p-4 sm:p-6 lg:min-w-0 lg:overflow-y-auto"
          style={{ width: "100%" }}
        >
          {isSessionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <CohortSessionMain contents={contents} sessionId={currentSessionId || ""} cohortId={cohortId} sessions={sessions} onSessionSelect={handleSessionSelect} />
          )}
        </main>

        {desktopSidebarOpen && (
          <div className="hidden lg:block lg:w-80 lg:border-l lg:bg-white">
            <CohortSessionSidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CohortSessionSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
}: {
  sessions: any[];
  currentSessionId: string | null;
  onSessionSelect: (id: string) => void;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Cohort Content</h2>
        <p className="text-gray-500 text-md font-semibold">
          {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
        </p>
      </div>
      <div className="p-4 space-y-3">
        {sessions.map((session, index) => (
          <button
            key={session.id}
            onClick={() => session.isAccessible && onSessionSelect(session.id)}
            disabled={!session.isAccessible}
            className={cn(
              "w-full rounded-2xl p-4 text-left transition-all",
              currentSessionId === session.id
                ? "bg-orange-100 border-l-4 border-orange-500"
                : "bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm",
              !session.isAccessible && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-4">
              {currentSessionId === session.id ? (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-sm">
                  {index + 1}
                </div>
              )}
              <div className="flex-1">
                <h3 className={cn(
                  "text-sm md:text-base font-semibold leading-tight",
                  currentSessionId === session.id ? "text-orange-700" : "text-gray-800"
                )}>
                  {session.title}
                </h3>
              </div>
              {!session.isAccessible ? (
                <div className="flex-shrink-0">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              ) : currentSessionId === session.id && (
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-orange-500"></div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CohortSessionMain({
  contents,
  sessionId,
  cohortId,
  sessions,
  onSessionSelect,
}: {
  contents: CohortSessionContent[];
  sessionId: string;
  cohortId: string;
  sessions: any[];
  onSessionSelect: (id: string) => void;
}) {
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<string | null>(null);

  // Get only accessible sessions for navigation
  const accessibleSessions = sessions.filter((s: any) => s.isAccessible);
  const currentAccessibleIndex = accessibleSessions.findIndex((s: any) => s.id === sessionId);

  // Fetch user's queries for this session
  const { data: userQueries, isLoading: _isLoadingQueries, refetch: refetchQueries } = useQuery({
    queryKey: ["session-queries", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/cohorts/${cohortId}/sessions/${sessionId}/queries`);
      if (!response.ok) throw new Error("Failed to fetch queries");
      return response.json();
    },
    enabled: !!sessionId,
  });

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !sessionId) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/cohorts/${cohortId}/sessions/${sessionId}/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: newQuestion }),
      });

      if (response.ok) {
        setNewQuestion("");
        refetchQueries();
      } else {
        console.error("Failed to submit question");
        toast.error("Failed to submit question");
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Failed to submit question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = async (queryId: string) => {
    if (!editQuestionText.trim()) return;

    try {
      const response = await fetch(`/api/cohorts/${cohortId}/sessions/${sessionId}/queries?queryId=${queryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: editQuestionText }),
      });

      if (response.ok) {
        toast.success("Question updated successfully");
        setEditingQueryId(null);
        setEditQuestionText("");
        refetchQueries();
      } else {
        console.error("Failed to edit question");
        toast.error("Failed to edit question");
      }
    } catch (error) {
      console.error("Error editing question:", error);
      toast.error("Failed to edit question");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!queryToDelete) return;

    try {
      const response = await fetch(`/api/cohorts/${cohortId}/sessions/${sessionId}/queries?queryId=${queryToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Question deleted successfully");
        setDeleteDialogOpen(false);
        setQueryToDelete(null);
        refetchQueries();
      } else {
        console.error("Failed to delete question");
        toast.error("Failed to delete question");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const sortOrder: string[] = ["live_session", "meet_mentor", "resources", "recording"];
  const sortedContents = [...contents].sort((a, b) => {
    // First sort by the predefined section type order
    const indexA = sortOrder.indexOf(a.sectionType);
    const indexB = sortOrder.indexOf(b.sectionType);
    if (indexA !== indexB) return indexA - indexB;
    // If same section type, sort by orderIndex
    return a.orderIndex - b.orderIndex;
  });

  return (
    <div className="space-y-6">
      {sortedContents.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No content available for this session</p>
        </div>
      ) : (
        sortedContents.map((content) => (
          <div key={content.id}>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
              {content.isUnlocked ? (
                <Unlock className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-orange-400" />
              )}
            </div>
            {content.isUnlocked ? (
              <div className="space-y-4">
              {content.sectionType === "live_session" && content.liveSessionLink && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">
                    Live Session Link
                  </h3>
                  {content.liveSessionLink && (
                    <a
                      href={content.liveSessionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 px-6 py-3.5 w-full sm:w-auto text-sm font-semibold rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-600/20 transition-all duration-300 hover:bg-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-600/30 active:translate-y-0 cursor-pointer"
                    >
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400"></span>
                      </span>
                      <span>Join Live Session</span>
                    </a>
                  )}
                </div>
              )}
              {content.images && content.images.length > 0 && content.sectionType === "live_session" && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <ImageCarousel images={content.images} />
                </div>
              )}
              {content.sectionType === "recording" && (content.videoUrl || stripHtml(content.content)) && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  {content.videoUrl && (
                    <div className="mb-4">
                      <video
                        src={content.videoUrl}
                        controls
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                  {stripHtml(content.content) && (
                    <div className="prose prose-slate max-w-none">
                      <HtmlRenderer content={content.content} />
                    </div>
                  )}
                </div>
              )}
              {content.images && content.images.length > 0 && content.sectionType === "recording" && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <ImageCarousel images={content.images} />
                </div>
              )}
              {/* Only render content block for non-recording sections (live_session, meet_mentor, resources) */}
              {stripHtml(content.content) && content.sectionType !== "recording" && (
                <div className="prose prose-slate max-w-none rounded-lg border border-gray-200 bg-white p-6">
                  <HtmlRenderer content={content.content} />
                </div>
              )}
              {content.sectionType === "resources" &&
                content.resources &&
                content.resources.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="space-y-4">
                      {/* Image Carousel */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "image").length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {content.resources
                            .filter((r: CohortSessionResource) => r.type === "image")
                            .sort((a: CohortSessionResource, b: CohortSessionResource) => a.orderIndex - b.orderIndex)
                            .map((resource: CohortSessionResource) => (
                              <div key={resource.id} className="relative group">
                                <img
                                  src={resource.url}
                                  alt={resource.name}
                                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-3 py-1 rounded-full text-sm font-medium"
                                  >
                                    View
                                  </a>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* PDF Resources with Google Docs Viewer */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "pdf").length > 0 && (
                        <div className="space-y-6">
                          {content.resources
                            .filter((r: CohortSessionResource) => r.type === "pdf")
                            .sort((a: CohortSessionResource, b: CohortSessionResource) => a.orderIndex - b.orderIndex)
                            .map((resource: CohortSessionResource) => (
                              <div key={resource.id} className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900">{resource.name}</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className="h-96">
                                    <iframe
                                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`}
                                      className="w-full h-full"
                                      title={resource.name}
                                      sandbox="allow-scripts allow-same-origin"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* PPT Resources */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "ppt").length > 0 && (
                        <div className="space-y-6">
                          {content.resources
                            .filter((r: CohortSessionResource) => r.type === "ppt")
                            .sort((a: CohortSessionResource, b: CohortSessionResource) => a.orderIndex - b.orderIndex)
                            .map((resource: CohortSessionResource) => (
                              <div key={resource.id} className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900">{resource.name}</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className="h-96">
                                    <iframe
                                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`}
                                      className="w-full h-full"
                                      title={resource.name}
                                      sandbox="allow-scripts allow-same-origin"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Link Resources */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "link").length > 0 && (
                        <div className="space-y-2">
                          {content.resources
                            .filter((r: CohortSessionResource) => r.type === "link")
                            .sort((a: CohortSessionResource, b: CohortSessionResource) => a.orderIndex - b.orderIndex)
                            .map((resource: CohortSessionResource) => (
                              <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:border-orange-500 hover:text-orange-700"
                              >
                                <span className="text-orange-500">🔗</span>
                                <span className="font-medium">{resource.name}</span>
                              </a>
                            ))}
                        </div>
                      )}

                      {/* Excel Resources */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "excel").length > 0 && (
                        <div className="space-y-6">
                          {content.resources
                            .filter((r: CohortSessionResource) => r.type === "excel")
                            .sort((a: CohortSessionResource, b: CohortSessionResource) => a.orderIndex - b.orderIndex)
                            .map((resource: CohortSessionResource) => (
                              <div key={resource.id} className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900">{resource.name}</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className="h-96">
                                    <iframe
                                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`}
                                      className="w-full h-full"
                                      title={resource.name}
                                      sandbox="allow-scripts allow-same-origin"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Word Resources */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "word").length > 0 && (
                        <div className="space-y-6">
                          {content.resources
                            .filter((r: CohortSessionResource) => r.type === "word")
                            .sort((a: CohortSessionResource, b: CohortSessionResource) => a.orderIndex - b.orderIndex)
                            .map((resource: CohortSessionResource) => (
                              <div key={resource.id} className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900">{resource.name}</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className="h-96">
                                    <iframe
                                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`}
                                      className="w-full h-full"
                                      title={resource.name}
                                      sandbox="allow-scripts allow-same-origin"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              {content.images && content.images.length > 0 && content.sectionType === "resources" && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <ImageCarousel images={content.images} />
                </div>
              )}
              {content.sectionType === "meet_mentor" &&
                content.mentors &&
                content.mentors.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 font-semibold text-gray-900">
                      Mentors
                    </h3>
                    <div className="space-y-4">
                      {content.mentors.map((mentor: CohortSessionMentor) => (
                        <div
                          key={mentor.id}
                          className="flex gap-4 rounded-lg border border-gray-200 p-4"
                        >
                          {mentor.imageUrl && (
                            <img
                              src={mentor.imageUrl}
                              alt={mentor.name}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {mentor.name}
                            </h4>
                            {mentor.role && (
                              <p className="text-sm text-gray-500">
                                {mentor.role}
                              </p>
                            )}
                            {mentor.bio && (
                              <p className="mt-2 text-sm text-gray-600">
                                {mentor.bio}
                              </p>
                            )}
                            <div className="mt-3 flex gap-2">
                              {mentor.linkedinUrl && (
                                <a
                                  href={mentor.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {mentor.otherLinks?.map((link, i) => (
                                <a
                                  key={i}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {link.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {content.images && content.images.length > 0 && content.sectionType === "meet_mentor" && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <ImageCarousel images={content.images} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-orange-300 bg-orange-50">
              <div className="text-center">
                <Lock className="mx-auto h-8 w-8 text-orange-500" />
                <p className="mt-2 text-sm font-medium text-orange-700">
                  {content.lockedMessage || "This section is locked. It will be unlocked soon!"}
                </p>
              </div>
            </div>
          )}
        </div>
      )))}

      {/* Session Related Queries Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-orange-600" />
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Session Related Queries</h3>
        </div>

        <form onSubmit={handleSubmitQuestion} className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              placeholder="Ask a question about this session..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none sm:flex-1"
            />
            <Button type="submit" disabled={isSubmitting || !newQuestion.trim()} className="sm:self-end" size="sm">
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>

        {/* Display user's questions and answers */}
        {userQueries && userQueries.length > 0 && (
          <div className="space-y-4">
            {userQueries.map((query: any) => (
              <div key={query.id} className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Question Section */}
                <div className="bg-gradient-to-r from-orange-50 to-white p-4 border-b border-gray-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 items-center justify-center">
                      <span className="text-orange-600 font-semibold text-sm">Q</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingQueryId === query.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editQuestionText}
                            onChange={(e) => setEditQuestionText(e.target.value)}
                            rows={2}
                            className="resize-none text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleEditQuestion(query.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingQueryId(null);
                              setEditQuestionText("");
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{query.question}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(query.createdAt).toLocaleDateString()} at {new Date(query.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </>
                      )}
                    </div>
                    {editingQueryId !== query.id && (
                      <div className="flex gap-0.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingQueryId(query.id);
                            setEditQuestionText(query.question);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setQueryToDelete(query.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Answer Section */}
                {query.answer ? (
                  <div className="bg-green-50 p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">A</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            Fire in the Belly
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-relaxed break-words">{query.answer}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4">
                    <div className="text-xs text-gray-500 italic">
                      We have received your response we will get back to you soon.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              setQueryToDelete(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuestion}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => {
            if (currentAccessibleIndex > 0) {
              onSessionSelect(accessibleSessions[currentAccessibleIndex - 1].id);
            }
          }}
          disabled={currentAccessibleIndex <= 0}
          className="w-auto"
        >
          Previous Session
        </Button>
        <Button
          onClick={() => {
            if (currentAccessibleIndex < accessibleSessions.length - 1) {
              onSessionSelect(accessibleSessions[currentAccessibleIndex + 1].id);
            }
          }}
          disabled={currentAccessibleIndex >= accessibleSessions.length - 1}
          className="w-auto"
        >
          Next Session
        </Button>
      </div>
    </div>
  );
}

function EmbeddedResourceViewer({ resource }: { resource: CohortSessionResource }) {
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900">{resource.name}</h4>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-gray-200">
        <div className="h-96">
          <iframe
            src={viewerUrl}
            className="h-full w-full"
            title={resource.name}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
}
