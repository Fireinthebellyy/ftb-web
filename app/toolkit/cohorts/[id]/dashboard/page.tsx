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
import { ArrowLeft, Menu, Lock, Unlock, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
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

export default function CohortDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const cohortId = params.id as string;

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const { data: cohortData, isLoading: isCohortLoading } =
    useCohortDetail(cohortId);

  const sessions = useMemo(() => cohortData?.sessions ?? [], [cohortData]);

  // Auto-select first session
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

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
              It will unlock in a few hours after verification. You will get contacted & get added to a WhatsApp community for access as well.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-3">
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
              <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                {sessionData?.session.title || "Select a session"}
              </h1>
            </div>
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Session Menu</SheetTitle>
                <CohortSessionSidebar
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSessionSelect={(id) => {
                    setCurrentSessionId(id);
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
            <CohortSessionMain contents={contents} sessionId={currentSessionId || ""} cohortId={cohortId} sessions={sessions} onSessionSelect={setCurrentSessionId} />
          )}
        </main>

        {desktopSidebarOpen && (
          <div className="hidden lg:block lg:w-80 lg:border-l lg:bg-white">
            <CohortSessionSidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSessionSelect={setCurrentSessionId}
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
        <p className="text-gray-500 text-sm mt-1">
          {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"} • 0 completed
        </p>
      </div>
      <div className="p-4 space-y-3">
        {sessions.map((session, index) => (
          <button
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            className={cn(
              "w-full rounded-2xl p-4 text-left transition-all",
              currentSessionId === session.id
                ? "bg-orange-100 border-l-4 border-orange-500"
                : "bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm"
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
                  "text-base font-semibold leading-tight",
                  currentSessionId === session.id ? "text-orange-700" : "text-gray-800"
                )}>
                  {session.title}
                </h3>
              </div>
              {currentSessionId === session.id && (
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

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

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
        toast.success("We will get back to you personally");
        setNewQuestion("");
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
              {content.sectionType === "live_session" && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">
                    Live Session Link
                  </h3>
                  {content.liveSessionLink && (
                    <a
                      href={content.liveSessionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:border-orange-500 hover:text-orange-700"
                    >
                      <span className="text-orange-500">🔗</span>
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
              {content.sectionType === "recording" && (
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
                  {content.content && (
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
              {content.content && content.sectionType !== "recording" && (
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
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-gray-700">Images</h4>
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
                        </div>
                      )}

                      {/* PDF Resources with Google Docs Viewer */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "pdf").length > 0 && (
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-gray-700">PDF Documents</h4>
                          <div className="space-y-3">
                            {content.resources
                              .filter((r: CohortSessionResource) => r.type === "pdf")
                              .sort((a: CohortSessionResource, b: CohortSessionResource) => a.orderIndex - b.orderIndex)
                              .map((resource: CohortSessionResource) => (
                                <div key={resource.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className="p-4 border-b border-gray-200">
                                    <p className="font-medium text-gray-900">{resource.name}</p>
                                  </div>
                                  <div className="h-96">
                                    <iframe
                                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`}
                                      className="w-full h-full"
                                      title={resource.name}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* PPT Resources */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "ppt").length > 0 && (
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-gray-700">Presentations</h4>
                          <div className="space-y-3">
                            {content.resources
                              .filter((r: CohortSessionResource) => r.type === "ppt")
                              .sort((a: CohortSessionResource, b: CohortSessionResource) => a.orderIndex - b.orderIndex)
                              .map((resource: CohortSessionResource) => (
                                <div
                                  key={resource.id}
                                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4"
                                >
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 font-medium text-gray-900 hover:text-orange-600"
                                  >
                                    {resource.name}
                                  </a>
                                  <span className="text-sm text-gray-500">PPT</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Link Resources */}
                      {content.resources.filter((r: CohortSessionResource) => r.type === "link").length > 0 && (
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-gray-700">Links</h4>
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
                                  <span>{resource.name}</span>
                                </a>
                              ))}
                          </div>
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
          <h3 className="text-lg font-semibold text-gray-900">Session Related Queries</h3>
        </div>

        <form onSubmit={handleSubmitQuestion} className="mb-6">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask a question about this session..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none"
            />
            <Button type="submit" disabled={isSubmitting || !newQuestion.trim()} className="self-end">
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>

      {/* Session Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = sessions.findIndex(s => s.id === sessionId);
            if (currentIndex > 0) {
              onSessionSelect(sessions[currentIndex - 1].id);
            }
          }}
          disabled={sessions.findIndex(s => s.id === sessionId) === 0}
          className="w-auto"
        >
          Previous Session
        </Button>
        <Button
          onClick={() => {
            const currentIndex = sessions.findIndex(s => s.id === sessionId);
            if (currentIndex < sessions.length - 1) {
              onSessionSelect(sessions[currentIndex + 1].id);
            }
          }}
          disabled={sessions.findIndex(s => s.id === sessionId) === sessions.length - 1}
          className="w-auto"
        >
          Next Session
        </Button>
      </div>
    </div>
  );
}
