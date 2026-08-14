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

interface SessionQuery {
  id: string;
  sessionId: string;
  sessionTitle: string;
  cohortId: string;
  cohortTitle: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  question: string;
  answer: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SessionQueriesManager() {
  const [queries, setQueries] = useState<SessionQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringQueryId, setAnsweringQueryId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerText, setEditAnswerText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCohort, setFilterCohort] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "answered" | "unanswered">("all");

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/session-queries");
      setQueries(response.data);
    } catch (error) {
      console.error("Error fetching queries:", error);
      toast.error("Failed to fetch queries");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (query: SessionQuery) => {
    if (!answerText.trim()) return;

    try {
      await axios.post(
        `/api/admin/cohorts/${query.cohortId}/sessions/${query.sessionId}/queries`,
        {
          queryId: answeringQueryId,
          answer: answerText,
        }
      );
      toast.success("Answer submitted successfully!");
      setAnswerText("");
      setAnsweringQueryId(null);
      fetchQueries();
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer");
    }
  };

  const handleEditAnswer = async (query: SessionQuery) => {
    if (!editAnswerText.trim()) return;

    try {
      await axios.put(
        `/api/admin/cohorts/${query.cohortId}/sessions/${query.sessionId}/queries`,
        {
          queryId: editingAnswerId,
          answer: editAnswerText,
        }
      );
      toast.success("Answer updated successfully");
      setEditingAnswerId(null);
      setEditAnswerText("");
      fetchQueries();
    } catch (error) {
      console.error("Error editing answer:", error);
      toast.error("Failed to edit answer");
    }
  };

  const handleDeleteAnswer = async (query: SessionQuery) => {
    if (!confirm("Are you sure you want to delete this answer?")) return;

    try {
      await axios.put(
        `/api/admin/cohorts/${query.cohortId}/sessions/${query.sessionId}/queries`,
        {
          queryId: query.id,
          answer: "",
        }
      );
      toast.success("Answer deleted successfully");
      fetchQueries();
    } catch (error) {
      console.error("Error deleting answer:", error);
      toast.error("Failed to delete answer");
    }
  };

  const handleDeleteQuery = async (query: SessionQuery) => {
    if (!confirm("Are you sure you want to delete this query and its answer?"))
      return;

    try {
      await axios.delete(
        `/api/admin/cohorts/${query.cohortId}/sessions/${query.sessionId}/queries?queryId=${query.id}`
      );
      toast.success("Query deleted successfully");
      fetchQueries();
    } catch (error) {
      console.error("Error deleting query:", error);
      toast.error("Failed to delete query");
    }
  };

  // Get unique cohorts and sessions for filters
  const cohorts = Array.from(new Set(queries.map((q) => q.cohortTitle))).filter(
    Boolean
  );
  const sessions = Array.from(new Set(queries.map((q) => q.sessionTitle))).filter(
    Boolean
  );

  // Filter queries
  const filteredQueries = queries.filter((query) => {
    const matchesSearch =
      !searchTerm ||
      query.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCohort =
      !filterCohort || query.cohortTitle === filterCohort;
    const matchesSession =
      !filterSession || query.sessionTitle === filterSession;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "answered" && query.answer) ||
      (filterStatus === "unanswered" && !query.answer);

    return matchesSearch && matchesCohort && matchesSession && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Session Queries Management</h2>
        <p className="text-muted-foreground">
          Manage and answer questions from all cohort sessions in one place
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions, answers, or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <select
              className="w-full border rounded px-3 py-2 bg-white"
              value={filterCohort}
              onChange={(e) => setFilterCohort(e.target.value)}
            >
              <option value="">All Cohorts</option>
              {cohorts.map((cohort) => (
                <option key={cohort} value={cohort}>
                  {cohort}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <select
              className="w-full border rounded px-3 py-2 bg-white"
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
            >
              <option value="">All Sessions</option>
              {sessions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <select
              className="w-full border rounded px-3 py-2 bg-white"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "all" | "answered" | "unanswered"
                )
              }
            >
              <option value="all">All Status</option>
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
            </select>
          </div>
          {(searchTerm || filterCohort || filterSession || filterStatus !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilterCohort("");
                setFilterSession("");
                setFilterStatus("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Queries List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <span className="sr-only">Loading queries</span>
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="text-muted-foreground h-12 w-12 mb-4" />
          <p className="text-muted-foreground mb-2">
            {queries.length === 0
              ? "No queries found across all sessions."
              : "No queries match your filters."}
          </p>
          {queries.length > 0 && (
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setFilterCohort("");
              setFilterSession("");
              setFilterStatus("all");
            }}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredQueries.length} of {queries.length} total queries
          </p>
          {filteredQueries.map((query) => (
            <div
              key={query.id}
              className="bg-white border rounded-lg p-4 space-y-3"
            >
              {/* Header with user info and context */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {query.cohortTitle}
                    </span>
                    <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      {query.sessionTitle}
                    </span>
                    {query.answer && (
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        Answered
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {query.userName || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({query.userEmail})
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(query.createdAt).toLocaleDateString()} at{" "}
                    {new Date(query.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteQuery(query)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Question */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{query.question}</p>
              </div>

              {/* Answer Section */}
              {query.answer ? (
                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 mb-1">
                        Admin Answer:
                      </p>
                      {editingAnswerId === query.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editAnswerText}
                            onChange={(e) => setEditAnswerText(e.target.value)}
                            rows={3}
                            className="resize-none text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditAnswer(query)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingAnswerId(null);
                                setEditAnswerText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700">{query.answer}</p>
                      )}
                    </div>
                    {editingAnswerId !== query.id && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingAnswerId(query.id);
                            setEditAnswerText(query.answer || "");
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAnswer(query)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  {answeringQueryId === query.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Type your answer..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAnswer(query)}
                          disabled={!answerText.trim()}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Submit Answer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAnsweringQueryId(null);
                            setAnswerText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setAnsweringQueryId(query.id)}>
                      <Send className="mr-2 h-4 w-4" />
                      Answer
                    </Button>
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
