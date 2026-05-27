"use client";

import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  MessageSquare,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";
import { toast } from "sonner";
import { ToolkitCommunityPost } from "@/types/interfaces";
import { cn } from "@/lib/utils";
import { useSubmitCommunityResponse } from "@/lib/queries-toolkits";

interface ToolkitCommunityPanelProps {
  posts: ToolkitCommunityPost[];
  isLoading: boolean;
  desktopSidebarOpen: boolean;
  toolkitId: string;
}

function CommunitySkeleton() {
  return (
    <div className="mx-auto space-y-6 lg:max-w-3xl">
      <Skeleton className="h-10 w-64 rounded-lg" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}

// ─── MCQ Card ────────────────────────────────────────────────────────────────

interface McqCardProps {
  post: ToolkitCommunityPost;
  toolkitId: string;
}

function McqCard({ post, toolkitId }: McqCardProps) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const submitResponse = useSubmitCommunityResponse(toolkitId);
  const options = post.options ?? [];
  const isAnswered = post.userSelectedIndex != null;

  const handleSelect = (index: number) => {
    if (isAnswered || submitResponse.isPending) return;
    setPendingIndex(index);
    submitResponse.mutate(
      { postId: post.id, selectedOptionIndex: index },
      { onSettled: () => setPendingIndex(null) }
    );
  };

  return (
    <div className="space-y-3 mt-4">
      {options.map((option, index) => {
        const isSelected = post.userSelectedIndex === index;
        const isCorrect = Boolean(option.isCorrect);
        const isPending = pendingIndex === index;

        let state: "idle" | "correct" | "wrong" | "correct-unselected" = "idle";
        if (isAnswered) {
          if (isSelected) {
            state = isCorrect ? "correct" : "wrong";
          } else if (isCorrect) {
            state = "correct-unselected";
          }
        }

        return (
          <button
            key={`${post.id}-${index}`}
            onClick={() => handleSelect(index)}
            disabled={isAnswered || submitResponse.isPending}
            className={cn(
              "group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-all duration-300 ease-in-out",
              !isAnswered && !submitResponse.isPending
                ? "cursor-pointer hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50/50 hover:shadow-md"
                : "",
              isAnswered && "cursor-default",
              state === "idle" && "border-gray-200 bg-white shadow-sm",
              state === "correct" && "border-emerald-400 bg-emerald-50/80 shadow-emerald-100 ring-2 ring-emerald-400 ring-offset-1",
              state === "wrong" && "border-red-300 bg-red-50/80 shadow-red-100 ring-2 ring-red-300 ring-offset-1",
              state === "correct-unselected" && "border-emerald-200 bg-emerald-50/40 opacity-90"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm transition-all duration-300",
                state === "idle" && "bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-700",
                state === "correct" && "bg-emerald-500 text-white shadow-emerald-200",
                state === "wrong" && "bg-red-400 text-white shadow-red-200",
                state === "correct-unselected" && "bg-emerald-100 text-emerald-700"
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                String.fromCharCode(65 + index)
              )}
            </span>

            <span
              className={cn(
                "flex-1 text-base font-medium transition-colors",
                state === "correct" && "text-emerald-900",
                state === "wrong" && "text-red-900",
                state === "correct-unselected" && "text-emerald-800",
                state === "idle" && "text-gray-700 group-hover:text-gray-900"
              )}
            >
              {option.text}
            </span>

            {state === "correct" && (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500 animate-in zoom-in" />
            )}
            {state === "wrong" && (
              <XCircle className="h-6 w-6 shrink-0 text-red-500 animate-in zoom-in" />
            )}
            {state === "correct-unselected" && (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
            )}
          </button>
        );
      })}

      <div className="mt-4 flex items-center justify-between">
        {isAnswered ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium animate-in fade-in slide-in-from-bottom-2",
              options[post.userSelectedIndex!]?.isCorrect
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            )}
          >
            {options[post.userSelectedIndex!]?.isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Correct! Well done.
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                Not quite — the correct answer is highlighted.
              </>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <HelpCircle className="h-4 w-4 text-orange-400" />
            Select an option to test your knowledge
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Poll Card ────────────────────────────────────────────────────────────────

interface PollCardProps {
  post: ToolkitCommunityPost;
  toolkitId: string;
}

function PollCard({ post, toolkitId }: PollCardProps) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const submitResponse = useSubmitCommunityResponse(toolkitId);
  const options = post.options ?? [];
  const isVoted = post.userSelectedIndex != null;
  const totalVotes = post.totalVotes ?? 0;

  const handleVote = (index: number) => {
    if (isVoted || submitResponse.isPending) return;
    setPendingIndex(index);
    submitResponse.mutate(
      { postId: post.id, selectedOptionIndex: index },
      { onSettled: () => setPendingIndex(null) }
    );
  };

  return (
    <div className="space-y-3 mt-4">
      {options.map((option, index) => {
        const isSelected = post.userSelectedIndex === index;
        const voteCount = post.optionVoteCounts?.[index] ?? 0;
        const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const isPending = pendingIndex === index;

        return (
          <div key={`${post.id}-${index}`} className="group space-y-1.5">
            <button
              onClick={() => handleVote(index)}
              disabled={isVoted || submitResponse.isPending}
              className={cn(
                "relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-5 py-4 text-left transition-all duration-300",
                !isVoted && !submitResponse.isPending
                  ? "cursor-pointer hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50/50 hover:shadow-md"
                  : "",
                isVoted && "cursor-default",
                isSelected
                  ? "border-orange-400 bg-white ring-2 ring-orange-400 ring-offset-1 shadow-sm"
                  : "border-gray-200 bg-white shadow-sm"
              )}
            >
              {isVoted && (
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all duration-1000 ease-out",
                    isSelected
                      ? "bg-gradient-to-r from-orange-100 to-orange-50"
                      : "bg-gray-100/80"
                  )}
                  style={{ width: `${pct}%` }}
                />
              )}

              <div className="relative z-10 flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm transition-colors",
                    isSelected
                      ? "bg-orange-500 text-white shadow-orange-200"
                      : "bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-700"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </span>

                <span
                  className={cn(
                    "font-medium text-base",
                    isSelected ? "text-orange-900" : "text-gray-700 group-hover:text-gray-900"
                  )}
                >
                  {option.text}
                </span>
              </div>

              {isVoted && (
                <div className="relative z-10 flex flex-col items-end gap-0.5">
                  <span
                    className={cn(
                      "text-lg font-bold tabular-nums tracking-tight",
                      isSelected ? "text-orange-600" : "text-gray-600"
                    )}
                  >
                    {pct}%
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    {voteCount} {voteCount === 1 ? "vote" : "votes"}
                  </span>
                </div>
              )}
            </button>
          </div>
        );
      })}

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase">
          <BarChart3 className="h-4 w-4 text-gray-500" />
          {isVoted ? (
            <span>{totalVotes} Total Responses</span>
          ) : (
            <span>Vote to reveal results</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface QnACardProps {
  post: ToolkitCommunityPost;
  toolkitId: string;
}

function QnACard({ post, toolkitId }: QnACardProps) {
  const [textResponse, setTextResponse] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const submitResponse = useSubmitCommunityResponse(toolkitId);
  const isAnswered = post.userTextResponse != null || post.userAttachmentUrl != null;

  const handleSubmit = async () => {
    if (!textResponse.trim() && !attachmentFile) {
      toast.error("Please provide a text response or an attachment.");
      return;
    }

    setIsUploading(true);
    let attachmentUrl, attachmentName, attachmentType;

    if (attachmentFile) {
      try {
        const uploaded = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: attachmentFile,
        });
        attachmentUrl = uploaded.publicUrl;
        attachmentName = attachmentFile.name;
        attachmentType = attachmentFile.type.startsWith("image/") ? "image" : "document";
      } catch (err) {
        toast.error("Failed to upload attachment");
        setIsUploading(false);
        return;
      }
    }

    submitResponse.mutate(
      {
        postId: post.id,
        textResponse: textResponse.trim() || undefined,
        attachmentUrl,
        attachmentName,
        attachmentType,
      },
      {
        onSettled: () => setIsUploading(false),
        onSuccess: () => toast.success("Response submitted successfully!"),
      }
    );
  };

  if (isAnswered) {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 mt-4">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
          <CheckCircle2 className="h-5 w-5" />
          <span>You have submitted your response</span>
        </div>
        {post.userTextResponse && (
          <div className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm text-gray-700 whitespace-pre-wrap">
            {post.userTextResponse}
          </div>
        )}
        {post.userAttachmentUrl && (
          <a
            href={post.userAttachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-orange-600 hover:underline bg-white border border-orange-100 px-4 py-2 rounded-lg"
          >
            {post.userAttachmentType?.startsWith("image") ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            {post.userAttachmentName || "View Attachment"}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-orange-500" />
          Your Response
        </label>
        <Textarea
          placeholder="Write your answer here..."
          value={textResponse}
          onChange={(e) => setTextResponse(e.target.value)}
          className="min-h-[120px] bg-white resize-none"
          disabled={submitResponse.isPending || isUploading}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText className="h-4 w-4 text-orange-500" />
          Attachment (Optional)
        </label>
        <Input
          type="file"
          onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
          className="bg-white"
          accept="image/*,application/pdf,.doc,.docx"
          disabled={submitResponse.isPending || isUploading}
        />
        {attachmentFile && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 mt-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">File '{attachmentFile.name}' ready to upload</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">Upload images, PDFs, or Word documents</p>
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitResponse.isPending || isUploading || (!textResponse.trim() && !attachmentFile)}
          className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]"
        >
          {submitResponse.isPending || isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Submit Answer"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function ToolkitCommunityPanel({
  posts,
  isLoading,
  desktopSidebarOpen,
  toolkitId,
}: ToolkitCommunityPanelProps) {
  if (isLoading) {
    return <CommunitySkeleton />;
  }

  return (
    <div
      className={cn(
        "mx-auto space-y-6 transition-all duration-300",
        desktopSidebarOpen ? "lg:max-w-3xl" : "lg:max-w-4xl"
      )}
    >
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm ring-1 ring-orange-100/50">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Course Community
        </h2>
        <p className="mt-2 text-base text-gray-600">
          Join the conversation. Complete activities, answer quizzes, and stay updated with announcements from the team.
        </p>
      </div>

      {posts.length === 0 ? (
        <Card className="overflow-hidden border-dashed border-gray-200 bg-gray-50/50">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center p-8">
            <div className="mb-6 rounded-full bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <MessageSquare className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No updates yet</h3>
            <p className="text-base text-gray-500 max-w-sm mx-auto">
              The community feed is currently empty. Check back later for polls, MCQs, and important announcements.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-8">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            className="overflow-hidden border-0 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-gray-200/60 transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]"
          >
            <CardContent className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "rounded-full px-3 py-1 font-semibold capitalize tracking-wide",
                    post.type === "mcq" && "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
                    post.type === "poll" && "bg-orange-100 text-orange-700 hover:bg-orange-200",
                    post.type === "text" && "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  )}
                >
                  {post.type}
                </Badge>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {new Date(post.createdAt || "").toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <h3 className="mb-4 text-2xl font-bold leading-tight text-gray-900">
                {post.title}
              </h3>

              {post.body ? (
                <div className="prose prose-gray max-w-none prose-p:leading-relaxed prose-a:text-orange-600 hover:prose-a:text-orange-500">
                  <p className="whitespace-pre-wrap text-[15px] text-gray-700">
                    {post.body}
                  </p>
                </div>
              ) : null}

              {post.type === "mcq" && post.options?.length ? (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <McqCard post={post} toolkitId={toolkitId} />
                </div>
              ) : null}

              {post.type === "poll" && post.options?.length ? (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <PollCard post={post} toolkitId={toolkitId} />
                </div>
              ) : null}

              {post.type === "qna" ? (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <QnACard post={post} toolkitId={toolkitId} />
                </div>
              ) : null}

              {post.attachmentUrl ? (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <a
                    href={post.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200 group-hover:text-orange-700 transition-colors">
                      {post.attachmentType?.startsWith("image/") ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>
                    {post.attachmentName || "View Attached File"}
                  </a>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
