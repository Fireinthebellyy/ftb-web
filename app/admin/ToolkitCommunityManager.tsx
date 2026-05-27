"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquarePlus,
  Trash2,
  Edit2,
  GripVertical,
  Plus,
  Upload,
  Link as LinkIcon,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  BarChart3,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFileViaSignedUrl, deleteStorageObjectClient } from "@/lib/storage/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ToolkitCommunityPost, ToolkitCommunityOption } from "@/types/interfaces";

interface Props {
  toolkitId: string;
  toolkitTitle: string;
  open: boolean;
  onClose: () => void;
}

const fetchAdminPosts = async (toolkitId: string) => {
  const res = await fetch(`/api/admin/toolkits/${toolkitId}/community`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  const data = await res.json();
  return data.posts as ToolkitCommunityPost[];
};

export default function ToolkitCommunityManager({ toolkitId, toolkitTitle, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<ToolkitCommunityPost | null>(null);
  const [viewingResponsesPost, setViewingResponsesPost] = useState<ToolkitCommunityPost | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-toolkit-community", toolkitId],
    queryFn: () => fetchAdminPosts(toolkitId),
  });

  const createMutation = useMutation({
    mutationFn: async (newPost: Partial<ToolkitCommunityPost>) => {
      const res = await fetch(`/api/admin/toolkits/${toolkitId}/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-toolkit-community", toolkitId] });
      toast.success("Community post created");
      setIsCreating(false);
    },
    onError: () => toast.error("Failed to create post"),
  });

  const updateMutation = useMutation({
    mutationFn: async (post: Partial<ToolkitCommunityPost> & { id: string }) => {
      const res = await fetch(`/api/admin/toolkit-community-posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      if (!res.ok) throw new Error("Failed to update post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-toolkit-community", toolkitId] });
      toast.success("Community post updated");
      setEditingPost(null);
    },
    onError: () => toast.error("Failed to update post"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/admin/toolkit-community-posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-toolkit-community", toolkitId] });
      toast.success("Community post deleted");
    },
    onError: () => toast.error("Failed to delete post"),
  });

  const handleCreate = () => {
    setEditingPost(null);
    setIsCreating(true);
  };

  const handleEdit = (post: ToolkitCommunityPost) => {
    setIsCreating(false);
    setEditingPost(post);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Community Feed: {toolkitTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Manage announcements, polls, and QnAs for this course.</p>
            </div>
            {!isCreating && !editingPost && (
          <Button onClick={handleCreate} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <MessageSquarePlus className="h-4 w-4" />
            New Post
          </Button>
        )}
      </div>

      {(isCreating || editingPost) ? (
        <PostEditor
          toolkitId={toolkitId}
          initialData={editingPost}
          onCancel={() => {
            setIsCreating(false);
            setEditingPost(null);
          }}
          onSave={(data) => {
            if (editingPost) {
              updateMutation.mutate({ ...data, id: editingPost.id });
            } else {
              createMutation.mutate(data);
            }
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      ) : (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50 text-center">
              <MessageSquarePlus className="mb-4 h-10 w-10 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900">No Community Posts</h3>
              <p className="mb-4 text-sm text-gray-500">Create the first post to engage your students.</p>
              <Button onClick={handleCreate} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Add Post
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className={!post.isPublished ? "opacity-60 grayscale-[30%]" : ""}>
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {post.type}
                      </Badge>
                      {!post.isPublished && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Draft
                        </Badge>
                      )}
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                    </div>
                    {post.body && (
                      <p className="line-clamp-2 text-sm text-gray-600">{post.body}</p>
                    )}
                    {post.options && post.options.length > 0 && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <BarChart3 className="h-4 w-4" />
                        {post.options.length} options • {post.totalVotes || 0} responses
                      </div>
                    )}
                    {post.type === "qna" && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Users className="h-4 w-4" />
                        <button onClick={() => setViewingResponsesPost(post)} className="text-orange-600 hover:underline">
                          View Responses
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this post? This cannot be undone.")) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Responses Dialog */}
      <Dialog open={!!viewingResponsesPost} onOpenChange={(open) => !open && setViewingResponsesPost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Q&A Responses</DialogTitle>
            <DialogDescription>
              {viewingResponsesPost?.title}
            </DialogDescription>
          </DialogHeader>
          {viewingResponsesPost && <QnAResponsesViewer toolkitId={toolkitId} postId={viewingResponsesPost.id} />}
        </DialogContent>
      </Dialog>
    </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── QnA Responses Viewer ──────────────────────────────────────────────────────

function QnAResponsesViewer({ toolkitId, postId }: { toolkitId: string; postId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-toolkit-community-responses", toolkitId, postId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/toolkits/${toolkitId}/community/${postId}/responses`);
      if (!res.ok) throw new Error("Failed to fetch responses");
      const data = await res.json();
      return data.responses as any[];
    },
  });

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  if (error) return <div className="text-red-500 text-sm">Error loading responses.</div>;
  if (!data?.length) return <div className="text-gray-500 text-sm py-4">No responses yet.</div>;

  return (
    <div className="space-y-4 mt-4">
      {data.map((r) => (
        <div key={r.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            {r.user?.image ? (
              <img src={r.user.image} alt={r.user.name} className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                {r.user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div>
              <p className="font-medium text-sm text-gray-900">{r.user?.name || "Unknown User"}</p>
              <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {r.textResponse && (
            <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {r.textResponse}
            </div>
          )}
          {r.attachmentUrl && (
            <a
              href={r.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-orange-600 hover:underline"
            >
              {r.attachmentType?.startsWith("image") ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {r.attachmentName || "View Attachment"}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Editor Component ──────────────────────────────────────────────────────────

interface PostEditorProps {
  toolkitId: string;
  initialData: ToolkitCommunityPost | null;
  onCancel: () => void;
  onSave: (data: Partial<ToolkitCommunityPost>) => void;
  isSaving: boolean;
}

function PostEditor({ toolkitId, initialData, onCancel, onSave, isSaving }: PostEditorProps) {
  const [type, setType] = useState(initialData?.type || "text");
  const [title, setTitle] = useState(initialData?.title || "");
  const [body, setBody] = useState(initialData?.body || "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);
  const [orderIndex, setOrderIndex] = useState(initialData?.orderIndex || 0);

  const [options, setOptions] = useState<ToolkitCommunityOption[]>(
    initialData?.options?.length
      ? initialData.options
      : [{ text: "", isCorrect: false }, { text: "", isCorrect: false }]
  );

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    let finalOptions = options;
    if (type !== "text" && type !== "qna") {
      finalOptions = options.filter(o => o.text.trim() !== "");
      if (finalOptions.length < 2) {
        toast.error("Polls and MCQs require at least 2 options");
        return;
      }
      if (type === "mcq" && !finalOptions.some(o => o.isCorrect)) {
        toast.error("MCQs require at least one correct option");
        return;
      }
    }

    let finalAttachmentUrl = initialData?.attachmentUrl;
    let finalAttachmentName = initialData?.attachmentName;
    let finalAttachmentType = initialData?.attachmentType;

    if (attachmentFile) {
      setIsUploading(true);
      try {
        const uploaded = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: attachmentFile,
        });
        finalAttachmentUrl = uploaded.publicUrl;
        finalAttachmentName = attachmentFile.name;
        finalAttachmentType = attachmentFile.type.startsWith("image/") ? "image" : "document";
      } catch (err) {
        toast.error("Failed to upload attachment");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSave({
      toolkitId,
      type,
      title,
      body,
      isPublished,
      orderIndex,
      options: type === "text" || type === "qna" ? [] : finalOptions,
      attachmentUrl: finalAttachmentUrl,
      attachmentName: finalAttachmentName,
      attachmentType: finalAttachmentType,
    });
  };

  return (
    <Card className="overflow-hidden border-orange-100 shadow-lg ring-1 ring-orange-50">
      <div className="border-b bg-gray-50/50 px-6 py-4">
        <CardTitle>{initialData ? "Edit Post" : "Create New Post"}</CardTitle>
      </div>
      <CardContent className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text / Announcement</SelectItem>
                <SelectItem value="poll">Poll</SelectItem>
                <SelectItem value="mcq">Multiple Choice Question (MCQ)</SelectItem>
                <SelectItem value="qna">Q&A (Text / File Response)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Published Status</Label>
              <p className="text-xs text-gray-500">
                {isPublished ? "Visible to students" : "Hidden as draft"}
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Title / Question</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. What is the most important metric?"
            className="text-lg font-medium"
          />
        </div>

        <div className="space-y-2">
          <Label>Body text (optional)</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add context or details..."
            rows={4}
          />
        </div>

        {(type === "poll" || type === "mcq") && (
          <div className="space-y-4 rounded-xl border bg-gray-50/50 p-5">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptions([...options, { text: "", isCorrect: false }])}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add Option
              </Button>
            </div>
            
            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white font-medium text-gray-500 shadow-sm border">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx].text = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 bg-white"
                  />
                  {type === "mcq" && (
                    <Button
                      variant={opt.isCorrect ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        const newOpts = [...options];
                        newOpts[idx].isCorrect = !newOpts[idx].isCorrect;
                        setOptions(newOpts);
                      }}
                      className={opt.isCorrect ? "bg-emerald-500 hover:bg-emerald-600 border-0" : ""}
                    >
                      <CheckCircle2 className={cn("h-4 w-4", opt.isCorrect ? "text-white" : "text-gray-400")} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (options.length <= 2) return;
                      const newOpts = options.filter((_, i) => i !== idx);
                      setOptions(newOpts);
                    }}
                    disabled={options.length <= 2}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Attachment (Image, PDF, Docs)</Label>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
              className="max-w-md"
              accept="image/*,application/pdf,.doc,.docx"
            />
            {(initialData?.attachmentName || attachmentFile) && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">
                  {attachmentFile ? "File selected and ready to upload" : `Current: ${initialData?.attachmentName}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isUploading} className="bg-orange-600 hover:bg-orange-700 min-w-[100px]">
            {isSaving || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
