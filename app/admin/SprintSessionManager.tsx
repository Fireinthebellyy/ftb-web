"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Lock,
  Unlock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const sessionSchema = z.object({
  title: z.string().min(1, { message: "Session title is required" }),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

interface SprintSessionManagerProps {
  sprintId: string;
  sprintTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function SprintSessionManager({
  sprintId,
  sprintTitle,
  open,
  onClose,
}: SprintSessionManagerProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [_isEditingContent, setIsEditingContent] = useState<any | null>(null);
  const [_sprintMentors, setSprintMentors] = useState<any[]>([]);

  const sessionForm = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: { title: "", orderIndex: 0 },
  });

  const fetchSessions = useCallback(async () => {
    if (!sprintId || !open) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/sprints/${sprintId}/sessions`);
      setSessions(res.data || []);
      if (res.data?.length > 0 && !selectedSession) {
        setSelectedSession(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching sprint sessions:", err);
      toast.error("Failed to load sprint sessions");
    } finally {
      setLoading(false);
    }
  }, [sprintId, open, selectedSession]);

  const fetchSprintMentors = useCallback(async () => {
    if (!sprintId || !open) return;
    try {
      const res = await axios.get(`/api/admin/sprints/${sprintId}`);
      setSprintMentors(res.data?.mentors || []);
    } catch (err) {
      console.error("Error fetching sprint mentors:", err);
    }
  }, [sprintId, open]);

  useEffect(() => {
    if (open) {
      fetchSessions();
      fetchSprintMentors();
    }
  }, [open, fetchSessions, fetchSprintMentors]);

  const handleCreateSession = async (data: any) => {
    try {
      await axios.post(`/api/admin/sprints/${sprintId}/sessions`, data);
      toast.success("Session created");
      setIsAddingSession(false);
      sessionForm.reset();
      fetchSessions();
    } catch (err) {
      console.error("Error creating session:", err);
      toast.error("Failed to create session");
    }
  };



  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Curriculum & Sessions — {sprintTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-base font-semibold text-zinc-200">Sessions List</h3>
            <Button
              size="sm"
              onClick={() => setIsAddingSession(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <Plus className="w-4 h-4" /> Add Session
            </Button>
          </div>

          {isAddingSession && (
            <Form {...sessionForm}>
              <form
                onSubmit={sessionForm.handleSubmit(handleCreateSession)}
                className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-4"
              >
                <h4 className="text-sm font-semibold text-zinc-300">New Session</h4>
                <FormField
                  control={sessionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Session 1: Fundamentals of Growth"
                          {...field}
                          className="bg-zinc-900 border-zinc-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingSession(false)}
                    className="border-zinc-700 text-zinc-300"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    Save Session
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {loading ? (
            <div className="py-12 text-center text-zinc-400">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              No sessions added yet for this sprint.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 border-r border-zinc-800 pr-4">
                {sessions.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-colors flex items-center justify-between ${
                      selectedSession?.id === s.id
                        ? "bg-zinc-800 border-emerald-500 text-white font-medium"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50"
                    }`}
                  >
                    <span className="truncate">
                      {idx + 1}. {s.title}
                    </span>
                  </button>
                ))}
              </div>

              <div className="md:col-span-2 space-y-4">
                {selectedSession ? (
                  <div>
                    <h4 className="text-lg font-bold text-zinc-100 mb-2">
                      {selectedSession.title}
                    </h4>

                    <div className="space-y-4 mt-4">
                      {(selectedSession.contents || []).map((c: any) => (
                        <div
                          key={c.id}
                          className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                              {c.sectionType.replace("_", " ")}
                            </span>
                            <div className="flex items-center gap-2">
                              {c.isUnlocked ? (
                                <span className="inline-flex items-center text-xs text-emerald-400 gap-1">
                                  <Unlock className="w-3 h-3" /> Unlocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs text-amber-400 gap-1">
                                  <Lock className="w-3 h-3" /> Locked
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingContent(c)}
                                className="h-7 px-2 text-zinc-300 hover:text-white"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                          <h5 className="text-sm font-semibold text-white">{c.title}</h5>
                          {c.liveSessionLink && (
                            <p className="text-xs text-blue-400 truncate">
                              Link: {c.liveSessionLink}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 py-12 text-center">
                    Select a session from the left to manage content.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
