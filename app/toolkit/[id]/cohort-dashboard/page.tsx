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
                      <p className="text-sm text-gray-500">No slots available right now.</p>
                    ) : (
                      availableSlots.map(slot => (
                        <button 
                          key={slot.id}
                          disabled={bookingLoading}
                          onClick={() => handleBookSlot(slot.id)}
                          className="w-full text-left p-3 border rounded-md hover:border-[#ff5e14] flex justify-between items-center transition-colors disabled:opacity-50"
                        >
                          <span>{new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleTimeString()}</span>
                          <span className="text-[#ff5e14] text-sm font-medium">Book</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="border-l pl-8">
                  <h3 className="font-medium mb-4">Your Upcoming Meets</h3>
                  {upcomingMeets.length === 0 ? (
                    <div className="bg-orange-50 border border-orange-100 rounded-md p-4">
                      <p className="text-sm text-gray-700">No upcoming meets scheduled yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingMeets.map(meet => (
                        <div key={meet.id} className="p-4 border rounded-md">
                          <p className="font-medium text-sm mb-2">Mentorship Session</p>
                          {meet.meetLink ? (
                            <a href={meet.meetLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium flex items-center">
                              Join Google Meet <BookOpen className="w-4 h-4 ml-2" />
                            </a>
                          ) : (
                            <p className="text-sm text-gray-500">Meet link will be available soon.</p>
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
