"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Check, MessageSquare, Calendar, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CohortChat } from "@/components/toolkit/CohortChat";

export default function CohortDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const toolkitId = params.id as string;
  const { data: session, isPending: sessionPending } = useSession();

  const [activeTab, setActiveTab] = useState("content");
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [upcomingMeets, setUpcomingMeets] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace(`/login?returnUrl=%2Ftoolkit%2F${toolkitId}%2Fcohort-dashboard`);
    }
  }, [session, sessionPending, router, toolkitId]);

  useEffect(() => {
    if (!session?.user) return;
    
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`/api/cohorts/onboarding?toolkitId=${toolkitId}`);
        if (!res.data.onboarding) {
          router.replace(`/toolkit/${toolkitId}/onboarding`);
          return;
        }
        setOnboardingData(res.data.onboarding);
        fetchMeetsAndSlots(res.data.onboarding.mentorId);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        toast.error("Failed to load your cohort data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [toolkitId, session, router]);
  
  const fetchMeetsAndSlots = async (mentorId: string) => {
    try {
      const [slotsRes, meetsRes] = await Promise.all([
        axios.get(`/api/mentor/availability?mentorId=${mentorId}`),
        axios.get(`/api/mentor/meets?toolkitId=${toolkitId}`)
      ]);
      setAvailableSlots(slotsRes.data.slots.filter((s: any) => !s.isBooked));
      setUpcomingMeets(meetsRes.data.meets);
    } catch (err) {
      console.error("Failed to load schedule data", err);
    }
  };

  const handleBookSlot = async (availabilityId: string) => {
    try {
      setBookingLoading(true);
      await axios.post('/api/mentor/meets', {
        availabilityId,
        mentorId: onboardingData.mentorId,
        toolkitId
      });
      toast.success("Meet booked successfully!");
      fetchMeetsAndSlots(onboardingData.mentorId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to book meet");
    } finally {
      setBookingLoading(false);
    }
  };
  
  if (sessionPending || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const TABS = [
    { id: "content", label: "Course Content", icon: BookOpen },
    { id: "chat", label: "Chat with Mentor", icon: MessageSquare },
    { id: "meet", label: "Mentor Meet", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Cohort Dashboard</h1>
          
          <div className="mt-6 flex space-x-4 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                    isActive
                      ? "border-[#ff5e14] text-[#ff5e14]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 flex-1">
        {activeTab === "content" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Your Learning Material</h2>
            <Card className="p-6">
              <p className="text-gray-600">Recorded lectures and digital products will appear here.</p>
              {/* Here we would render the actual toolkit content list using existing components */}
              <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-center text-sm text-gray-500">
                Content integration placeholder
              </div>
            </Card>
          </div>
        )}

        {activeTab === "chat" && onboardingData && session?.user && (
          <div className="space-y-6 h-full flex flex-col">
            <h2 className="text-xl font-semibold">Chat with Your Mentor</h2>
            <Card className="flex-1 min-h-[600px] bg-white overflow-hidden flex flex-col">
              <CohortChat 
                toolkitId={toolkitId} 
                currentUserId={session.user.id} 
                mentorId={onboardingData.mentorId} 
              />
            </Card>
          </div>
        )}

        {activeTab === "meet" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Book a Mentor Meet</h2>
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium mb-4">Available Time Slots</h3>
                  <div className="space-y-3">
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-500">No slots available right now. Check back later!</p>
                    ) : (
                      availableSlots.map(slot => (
                        <button 
                          key={slot.id}
                          disabled={bookingLoading}
                          onClick={() => handleBookSlot(slot.id)}
                          className="w-full text-left p-4 border-2 rounded-lg hover:border-[#ff5e14] hover:bg-orange-50 flex justify-between items-center transition-all disabled:opacity-50 group"
                        >
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {new Date(slot.startTime).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(slot.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} — {new Date(slot.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <span className="text-[#ff5e14] text-sm font-semibold group-hover:underline">Book →</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="border-l pl-8">
                  <h3 className="font-medium mb-4">Your Upcoming Meets</h3>
                  {upcomingMeets.length === 0 ? (
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-6 text-center">
                      <Calendar className="w-8 h-8 text-orange-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">No sessions booked yet</p>
                      <p className="text-xs text-gray-400 mt-1">Book a slot from the left to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingMeets.map(meet => (
                        <div key={meet.id} className="p-4 border-2 rounded-lg bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-sm text-gray-900">Mentorship Session</p>
                              {meet.slot && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {new Date(meet.slot.startTime).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                                  {" · "}
                                  {new Date(meet.slot.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} — {new Date(meet.slot.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meet.meetLink ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                              {meet.meetLink ? "Link Ready" : "Pending"}
                            </span>
                          </div>
                          {meet.meetLink ? (
                            <a 
                              href={meet.meetLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-[#ff5e14] text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-[#e04f0d] transition-colors"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.9,14.4l2.5,2.5c0.1,0.1,0.3,0.1,0.4,0l2.1-2.1c0.3-0.3,0.1-0.8-0.3-0.8H16C15.8,14,15.7,14.1,15.9,14.4z"/><path d="M3,7h18v10H3V7z M1,7C1,5.9,1.9,5,3,5h18c1.1,0,2,0.9,2,2v10c0,1.1-0.9,2-2,2H3c-1.1,0-2-0.9-2-2V7z"/></svg>
                              Join Google Meet
                            </a>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                              Meet link coming soon...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
