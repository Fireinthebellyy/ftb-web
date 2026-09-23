"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  MessageCircle,
  Send,
  Edit,
  Trash2,
  Search,
} from "lucide-react";

interface SprintSessionQuery {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sprintId: string;
  sprintTitle: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  question: string;
  answer: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SprintSessionQueriesManager() {
  const [queries, setQueries] = useState<SprintSessionQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringQueryId, setAnsweringQueryId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerDrafts, setEditAnswerDrafts] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSprint, setFilterSprint] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "answered" | "unanswered">("all");

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/sprint-session-queries");
      setQueries(response.data);
    } catch (error) {
      console.error("Error fetching sprint queries:", error);
      toast.error("Failed to fetch sprint queries");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (query: SprintSessionQuery) => {
    if (answeringQueryId !== query.id) {
      toast.error("Query ID mismatch");
      return;
    }
    const draft = answerDrafts[query.id] ?? "";
    if (!draft.trim()) return;

    try {
      await axios.post(
        `/api/admin/sprints/${query.sprintId}/sessions/${query.sessionId}/queries`,
        {
          queryId: answeringQueryId,
          answer: draft,
        }
      );
      toast.success("Answer submitted successfully!");
      setAnswerDrafts((prev) => {
        const next = { ...prev };
        delete next[query.id];
        return next;
      });
      setAnsweringQueryId(null);
      fetchQueries();
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer");
    }
  };

  const handleEditAnswer = async (query: SprintSessionQuery) => {
    if (editingAnswerId !== query.id) {
      toast.error("Query ID mismatch");
      return;
    }
    const draft = editAnswerDrafts[query.id] ?? "";
    if (!draft.trim()) return;

    try {
      await axios.put(
        `/api/admin/sprints/${query.sprintId}/sessions/${query.sessionId}/queries`,
        {
          queryId: editingAnswerId,
          answer: draft,
        }
      );
      toast.success("Answer updated successfully!");
      setEditAnswerDrafts((prev) => {
        const next = { ...prev };
        delete next[query.id];
        return next;
      });
      setEditingAnswerId(null);
      fetchQueries();
    } catch (error) {
      console.error("Error editing answer:", error);
      toast.error("Failed to edit answer");
    }
  };

  const handleDeleteQuery = async (query: SprintSessionQuery) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await axios.delete(
        `/api/admin/sprints/${query.sprintId}/sessions/${query.sessionId}/queries?queryId=${query.id}`
      );
      toast.success("Query deleted successfully!");
      fetchQueries();
    } catch (error) {
      console.error("Error deleting query:", error);
      toast.error("Failed to delete query");
    }
  };

  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.answer && q.answer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.userName && q.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.userEmail && q.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSprint = !filterSprint || q.sprintId === filterSprint;
    const matchesSession = !filterSession || q.sessionId === filterSession;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "answered" && q.answer !== null) ||
      (filterStatus === "unanswered" && q.answer === null);

    return matchesSearch && matchesSprint && matchesSession && matchesStatus;
  });

  const sprintOptions = Array.from(
    new Map(queries.map((q) => [q.sprintId, { id: q.sprintId, title: q.sprintTitle }])).values()
  );

  const sessionOptions = Array.from(
    new Map(queries.map((q) => [q.sessionId, { id: q.sessionId, title: q.sessionTitle }])).values()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-amber-400" />
            Sprint Q&A Management
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Answer questions submitted by sprint participants.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search questions or answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-sm"
          />
        </div>

        <select
          value={filterSprint}
          onChange={(e) => setFilterSprint(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Sprints</option>
          {sprintOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Sessions</option>
          {sessionOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200"
        >
          <option value="all">All Statuses</option>
          <option value="unanswered">Unanswered Only</option>
          <option value="answered">Answered Only</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading sprint Q&A...
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
          No sprint queries found matching your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-xl border bg-zinc-900/60 border-zinc-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {q.sprintTitle || "Sprint"}
                  </span>
                  <span className="text-xs text-zinc-400">
                    Session: {q.sessionTitle || "General"}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">
                  Asked by <strong className="text-zinc-200">{q.userName || q.userEmail || "Student"}</strong> on {new Date(q.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">Q: {q.question}</h4>
              </div>

              {q.answer ? (
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                    <span>Answer:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingAnswerId(q.id);
                        setEditAnswerDrafts((prev) => ({ ...prev, [q.id]: q.answer! }));
                      }}
                      className="h-6 px-2 text-zinc-400 hover:text-white"
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>

                  {editingAnswerId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editAnswerDrafts[q.id] || ""}
                        onChange={(e) =>
                          setEditAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="bg-zinc-900 border-zinc-700 text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAnswerId(null)}
                          className="border-zinc-700 text-zinc-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditAnswer(q)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Save Answer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap">{q.answer}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {answeringQueryId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write answer for the student..."
                        value={answerDrafts[q.id] || ""}
                        onChange={(e) =>
                          setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="bg-zinc-950 border-zinc-800 text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAnsweringQueryId(null)}
                          className="border-zinc-700 text-zinc-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAnswer(q)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit Answer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-400 font-medium">
                        Waiting for answer
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setAnsweringQueryId(q.id);
                            setAnswerDrafts((prev) => ({ ...prev, [q.id]: "" }));
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> Answer
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteQuery(q)}
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
