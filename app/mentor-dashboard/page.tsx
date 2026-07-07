"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CohortChat } from "@/components/toolkit/CohortChat";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function MentorDashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [activeTab, setActiveTab] = useState("schedule");
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [newSlotStart, setNewSlotStart] = useState("");
  const [newSlotEnd, setNewSlotEnd] = useState("");
  const [mentees, setMentees] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace(`/login?returnUrl=%2Fmentor-dashboard`);
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (!session?.user) return;
    fetchSlots();
  }, [session]);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`/api/mentor/availability`);
      setSlots(res.data.slots || []);
      const menteesRes = await axios.get(`/api/mentor/mentees`);
      setMentees(menteesRes.data.mentees || []);
      const chatsRes = await axios.get(`/api/mentor/chats`);
      setChats(chatsRes.data.rooms || []);
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 403) {
        toast.error("You don't have mentor access.");
        router.replace("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotStart || !newSlotEnd) return;

    try {
      await axios.post("/api/mentor/availability", {
        startTime: newSlotStart,
        endTime: newSlotEnd,
      });
      toast.success("Slot added successfully");
      fetchSlots();
      setNewSlotStart("");
      setNewSlotEnd("");
    } catch (_err) {
      toast.error("Failed to add slot");
    }
  };

  if (sessionPending || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Mentor Portal</h1>
          
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "schedule" ? "border-[#ff5e14] text-[#ff5e14]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              My Schedule
            </button>
            <button
              onClick={() => setActiveTab("chats")}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "chats" ? "border-[#ff5e14] text-[#ff5e14]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Student Chats
            </button>
            <button
              onClick={() => setActiveTab("mentees")}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "mentees" ? "border-[#ff5e14] text-[#ff5e14]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Your Mentees
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        {activeTab === "schedule" && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Add Availability Slot</h2>
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input 
                    type="datetime-local" 
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff5e14]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input 
                    type="datetime-local" 
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff5e14]"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Add Slot</Button>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Your Slots</h2>
              {slots.length === 0 ? (
                <p className="text-sm text-gray-500">No slots added yet.</p>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div key={slot.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleTimeString()}</p>
                        <p className="text-xs text-gray-500">{slot.isBooked ? "Booked" : "Available"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "chats" && (
          <div className="h-[600px] flex flex-col md:flex-row gap-6">
            {!selectedChatRoom || window.innerWidth >= 768 ? (
              <Card className={`p-4 flex-shrink-0 md:w-80 overflow-y-auto ${selectedChatRoom ? 'hidden md:block' : 'block w-full'}`}>
                <h2 className="text-xl font-semibold mb-4">Student Chats</h2>
                {chats.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    <p>No chat rooms yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChatRoom(chat.id)}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedChatRoom === chat.id ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      >
                        {chat.student.image ? (
                          <img src={chat.student.image} alt={chat.student.name} className="h-10 w-10 rounded-full object-cover border" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                            {chat.student.name?.charAt(0).toUpperCase() || "S"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate text-gray-900">{chat.student.name}</p>
                          <p className="text-xs text-gray-500 truncate">Chat Room</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            ) : null}
            
            {selectedChatRoom ? (
              <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b flex items-center gap-3 bg-gray-50">
                  <button onClick={() => setSelectedChatRoom(null)} className="md:hidden text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">Conversation</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CohortChat 
                    currentUserId={session.user.id} 
                    initialRoomId={selectedChatRoom} 
                  />
                </div>
              </Card>
            ) : (
              <Card className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-500 bg-gray-50/50">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                <p>Select a student to start chatting</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === "mentees" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Your Mentees</h2>
            {mentees.length === 0 ? (
              <Card className="p-6">
                <div className="text-center py-12 text-gray-500 text-sm">
                  <p>You don&apos;t have any mentees yet.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {mentees.map((mentee) => (
                  <Card key={mentee.id} className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {mentee.user.image ? (
                        <img src={mentee.user.image} alt={mentee.user.name} className="h-12 w-12 rounded-full object-cover border" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-700">
                          {mentee.user.name?.charAt(0).toUpperCase() || "S"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{mentee.user.name}</h3>
                        <p className="text-sm text-gray-500">{mentee.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</span>
                        <p className="text-sm font-medium mt-1">{mentee.stream || "Not specified"}</p>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Future Options Interested</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(mentee.futureOptions || []).map((opt: string, i: number) => (
                            <span key={i} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              {opt}
                            </span>
                          ))}
                          {(!mentee.futureOptions || mentee.futureOptions.length === 0) && (
                            <span className="text-sm text-gray-600">None selected</span>
                          )}
                        </div>
                      </div>

                      {mentee.customOptions && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Other Interests</span>
                          <p className="text-sm text-gray-700 mt-1">{mentee.customOptions}</p>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <span className="text-xs text-gray-400">Joined Cohort: {new Date(mentee.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
