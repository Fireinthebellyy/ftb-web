/* eslint-disable max-lines */
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Loader2,
  Lock,
  Unlock,
  User,
  FileText,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";

// Session schema for creating/editing a cohort session
const sessionSchema = z.object({
  title: z.string().min(1, { message: "Session title is required" }),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

// Schema for session content (4 sections per session)
const sessionContentSchema = z.object({
  sectionType: z.enum(["live_session", "meet_mentor", "resources", "recording"]),
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().optional(),
  isUnlocked: z.boolean().default(false),
  lockedMessage: z.string().optional(),
  liveSessionLink: z.string().optional(),
  videoUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
});

// Schema for mentor
const mentorSchema = z.object({
  contentId: z.string().min(1, { message: "Content ID is required" }),
  name: z.string().min(1, { message: "Mentor name is required" }),
  role: z.string().optional(),
  imageUrl: z.string().optional(),
  bio: z.string().optional(),
  linkedinUrl: z.string().optional(),
  otherLinks: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

// Schema for resource
const resourceSchema = z.object({
  contentId: z.string().min(1, { message: "Content ID is required" }),
  name: z.string().min(1, { message: "Resource name is required" }),
  url: z.string().min(1, { message: "Resource URL is required" }),
  type: z.enum(["file", "video", "link", "image", "pdf", "ppt"]),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

type SessionFormValues = z.infer<typeof sessionSchema>;
type SessionContentFormValues = z.infer<typeof sessionContentSchema>;
type MentorFormValues = z.infer<typeof mentorSchema>;
type ResourceFormValues = z.infer<typeof resourceSchema>;

interface CohortSession {
  id: string;
  cohortId: string;
  title: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  contents: CohortSessionContent[];
}

interface CohortSessionContent {
  id: string;
  sessionId: string;
  sectionType: "live_session" | "meet_mentor" | "resources" | "recording";
  title: string;
  content: string | null;
  isUnlocked: boolean;
  lockedMessage: string | null;
  liveSessionLink: string | null;
  videoUrl: string | null;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
  mentors?: CohortSessionMentor[];
  resources?: CohortSessionResource[];
}

interface CohortSessionMentor {
  id: string;
  contentId: string;
  name: string;
  role: string | null;
  imageUrl: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  otherLinks: { title: string; url: string }[];
  orderIndex: number;
  createdAt: string;
}

interface CohortSessionResource {
  id: string;
  contentId: string;
  name: string;
  url: string;
  type: "file" | "video" | "link" | "image" | "pdf" | "ppt";
  orderIndex: number;
  createdAt: string;
}

interface CohortSessionManagerProps {
  cohortId: string;
  cohortTitle: string;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  live_session: "Live Session",
  meet_mentor: "Meet The Mentor",
  resources: "Resources & Presentation",
  recording: "Session Recording",
};

export default function CohortSessionManager({
  cohortId,
  cohortTitle,
  open,
  onClose,
  onUpdate,
}: CohortSessionManagerProps) {
  const [sessions, setSessions] = useState<CohortSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionEditDialogOpen, setSessionEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CohortSession | null>(null);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [contentEditDialogOpen, setContentEditDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<CohortSessionContent | null>(null);
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [selectedSessionForContent, setSelectedSessionForContent] = useState<CohortSession | null>(null);
  const [mentorEditDialogOpen, setMentorEditDialogOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<CohortSessionMentor | null>(null);
  const [isAddingMentor, setIsAddingMentor] = useState(false);
  const [selectedContentForMentor, setSelectedContentForMentor] = useState<CohortSessionContent | null>(null);
  const [resourceEditDialogOpen, setResourceEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<CohortSessionResource | null>(null);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [selectedContentForResource, setSelectedContentForResource] = useState<CohortSessionContent | null>(null);

  const sessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      orderIndex: 0,
    },
  });

  const contentForm = useForm<SessionContentFormValues>({
    resolver: zodResolver(sessionContentSchema),
    defaultValues: {
      sectionType: "live_session",
      title: "",
      content: "",
      isUnlocked: false,
      liveSessionLink: "",
      videoUrl: "",
      images: [],
    },
  });

  const mentorForm = useForm<MentorFormValues>({
    resolver: zodResolver(mentorSchema),
    defaultValues: {
      contentId: "",
      name: "",
      role: "",
      imageUrl: "",
      bio: "",
      linkedinUrl: "",
      otherLinks: [],
      orderIndex: 0,
    },
  });

  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      contentId: "",
      name: "",
      url: "",
      type: "file",
      orderIndex: 0,
    },
  });

  const fetchSessions = useCallback(async () => {
    if (!open) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/cohorts/${cohortId}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  }, [open, cohortId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleEditSession = (session: CohortSession) => {
    setEditingSession(session);
    setIsAddingSession(false);
    sessionForm.reset({
      title: session.title,
      orderIndex: session.orderIndex,
    });
    setSessionEditDialogOpen(true);
  };

  const handleAddSession = () => {
    const maxOrder = sessions.length > 0 ? Math.max(...sessions.map((s) => s.orderIndex)) : -1;
    setEditingSession(null);
    setIsAddingSession(true);
    sessionForm.reset({
      title: "",
      orderIndex: maxOrder + 1,
    });
    setSessionEditDialogOpen(true);
  };

  const handleSaveSession = async (data: SessionFormValues) => {
    try {
      if (editingSession) {
        await axios.put(`/api/admin/cohort-sessions/${editingSession.id}`, data);
        toast.success("Session updated successfully!");
      } else {
        await axios.post(`/api/admin/cohorts/${cohortId}/sessions`, data);
        toast.success("Session added successfully!");
      }
      setSessionEditDialogOpen(false);
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error(isAddingSession ? "Failed to add session" : "Failed to update session");
    }
  };

  const handleDeleteSession = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete session "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`/api/admin/cohort-sessions/${id}`);
      toast.success("Session deleted successfully!");
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const handleEditContent = (session: CohortSession, content: CohortSessionContent) => {
    setSelectedSessionForContent(session);
    setEditingContent(content);
    setIsAddingContent(false);
    contentForm.reset({
      sectionType: content.sectionType,
      title: content.title,
      content: content.content ?? "",
      isUnlocked: content.isUnlocked,
      lockedMessage: content.lockedMessage ?? "",
      liveSessionLink: content.liveSessionLink ?? "",
      videoUrl: content.videoUrl ?? "",
      images: content.images ?? [],
    });
    setContentEditDialogOpen(true);
  };

  const handleAddContent = (session: CohortSession, sectionType: string) => {
    setSelectedSessionForContent(session);
    setEditingContent(null);
    setIsAddingContent(true);
    contentForm.reset({
      sectionType: sectionType as any,
      title: CONTENT_TYPE_LABELS[sectionType] || "",
      content: "",
      isUnlocked: false,
      liveSessionLink: "",
      videoUrl: "",
      images: [],
    });
    setContentEditDialogOpen(true);
  };

  const handleSaveContent = async (data: SessionContentFormValues) => {
    if (!selectedSessionForContent) return;
    try {
      const payload: any = {
        sectionType: data.sectionType,
        title: data.title,
        content: data.content || null,
        isUnlocked: data.isUnlocked,
      };

      // Include locked message if provided
      if (data.lockedMessage) {
        payload.lockedMessage = data.lockedMessage;
      }

      // Include live session link if it's a live session
      if (data.sectionType === "live_session" && data.liveSessionLink) {
        payload.liveSessionLink = data.liveSessionLink;
      }

      // Only include videoUrl if it has a value and it's a recording
      if (data.sectionType === "recording" && data.videoUrl) {
        payload.videoUrl = data.videoUrl;
      }

      // Include images if provided
      if (data.images && data.images.length > 0) {
        payload.images = data.images;
      }

      if (editingContent) {
        await axios.put(`/api/admin/cohort-session-contents/${editingContent.id}`, payload);
        toast.success("Content updated successfully!");
      } else {
        await axios.post(`/api/admin/cohort-sessions/${selectedSessionForContent.id}/content`, payload);
        toast.success("Content added successfully!");
      }
      setContentEditDialogOpen(false);
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error(isAddingContent ? "Failed to add content" : "Failed to update content");
    }
  };

  const handleDeleteContent = async (content: CohortSessionContent, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`/api/admin/cohort-session-contents/${content.id}`);
      toast.success("Content deleted successfully!");
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  };

  const handleToggleLock = async (content: CohortSessionContent) => {
    try {
      await axios.put(`/api/admin/cohort-session-contents/${content.id}`, {
        isUnlocked: !content.isUnlocked,
      });
      toast.success(`Content ${!content.isUnlocked ? "unlocked" : "locked"} successfully!`);
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("Failed to update lock status");
    }
  };

  const handleEditMentor = (content: CohortSessionContent, mentor: CohortSessionMentor) => {
    setSelectedContentForMentor(content);
    setEditingMentor(mentor);
    setIsAddingMentor(false);
    mentorForm.reset({
      contentId: content.id,
      name: mentor.name,
      role: mentor.role ?? "",
      imageUrl: mentor.imageUrl ?? "",
      bio: mentor.bio ?? "",
      linkedinUrl: mentor.linkedinUrl ?? "",
      otherLinks: mentor.otherLinks ?? [],
      orderIndex: mentor.orderIndex,
    });
    setMentorEditDialogOpen(true);
  };

  const handleAddMentor = (content: CohortSessionContent) => {
    setSelectedContentForMentor(content);
    setEditingMentor(null);
    setIsAddingMentor(true);
    const maxOrder = content.mentors && content.mentors.length > 0 
      ? Math.max(...content.mentors.map((m) => m.orderIndex)) 
      : -1;
    mentorForm.reset({
      contentId: content.id,
      name: "",
      role: "",
      imageUrl: "",
      bio: "",
      linkedinUrl: "",
      otherLinks: [],
      orderIndex: maxOrder + 1,
    });
    setMentorEditDialogOpen(true);
  };

  const handleSaveMentor = async (data: MentorFormValues) => {
    if (!selectedContentForMentor) return;
    try {
      if (editingMentor) {
        await axios.put(`/api/admin/cohort-session-mentors/${editingMentor.id}`, data);
        toast.success("Mentor updated successfully!");
      } else {
        await axios.post("/api/admin/cohort-session-mentors", data);
        toast.success("Mentor added successfully!");
      }
      setMentorEditDialogOpen(false);
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error saving mentor:", error);
      toast.error(isAddingMentor ? "Failed to add mentor" : "Failed to update mentor");
    }
  };

  const handleDeleteMentor = async (mentor: CohortSessionMentor, name: string) => {
    if (!confirm(`Are you sure you want to delete mentor "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`/api/admin/cohort-session-mentors/${mentor.id}`);
      toast.success("Mentor deleted successfully!");
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error deleting mentor:", error);
      toast.error("Failed to delete mentor");
    }
  };

  const handleEditResource = (content: CohortSessionContent, resource: CohortSessionResource) => {
    setSelectedContentForResource(content);
    setEditingResource(resource);
    setIsAddingResource(false);
    resourceForm.reset({
      contentId: content.id,
      name: resource.name,
      url: resource.url,
      type: resource.type,
      orderIndex: resource.orderIndex,
    });
    setResourceEditDialogOpen(true);
  };

  const handleAddResource = (content: CohortSessionContent) => {
    setSelectedContentForResource(content);
    setEditingResource(null);
    setIsAddingResource(true);
    const maxOrder = content.resources && content.resources.length > 0
      ? Math.max(...content.resources.map((r) => r.orderIndex))
      : -1;
    resourceForm.reset({
      contentId: content.id,
      name: "",
      url: "",
      type: "pdf",
      orderIndex: maxOrder + 1,
    });
    setResourceEditDialogOpen(true);
  };

  const handleSaveResource = async (data: ResourceFormValues) => {
    if (!selectedContentForResource) return;
    try {
      if (editingResource) {
        await axios.put(`/api/admin/cohort-session-resources/${editingResource.id}`, data);
        toast.success("Resource updated successfully!");
      } else {
        // Check if url contains multiple resources (JSON string)
        if (data.url && data.url.startsWith('[')) {
          const multipleResources = JSON.parse(data.url);
          const promises = multipleResources.map((resource: any) =>
            axios.post("/api/admin/cohort-session-resources", {
              ...data,
              name: resource.name,
              url: resource.url,
              type: resource.type,
            })
          );
          await Promise.all(promises);
          toast.success(`${multipleResources.length} resources added successfully!`);
        } else {
          await axios.post("/api/admin/cohort-session-resources", data);
          toast.success("Resource added successfully!");
        }
      }
      setResourceEditDialogOpen(false);
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error(isAddingResource ? "Failed to add resource" : "Failed to update resource");
    }
  };

  const handleDeleteResource = async (resource: CohortSessionResource, name: string) => {
    if (!confirm(`Are you sure you want to delete resource "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`/api/admin/cohort-session-resources/${resource.id}`);
      toast.success("Resource deleted successfully!");
      fetchSessions();
      onUpdate();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Manage Cohort Sessions: {cohortTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Add and manage cohort sessions
            </p>
            <Button onClick={handleAddSession} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Session
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              <span className="sr-only">Loading sessions</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No sessions found. Add your first session!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <GripVertical className="text-muted-foreground h-4 w-4" />
                        <h3 className="font-medium text-lg">
                          {session.orderIndex + 1}. {session.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSession(session)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Session
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSession(session.id, session.title)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Session
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Session Content</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => {
                          const existingContent = session.contents.find(c => c.sectionType === key);
                          return (
                            <div key={key} className="border rounded p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{label}</span>
                                {existingContent && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700`}>
                                    Added
                                  </span>
                                )}
                              </div>
                              {existingContent ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleLock(existingContent)}
                                    title={existingContent.isUnlocked ? "Lock content" : "Unlock content"}
                                  >
                                    {existingContent.isUnlocked ? (
                                      <Unlock className="h-3 w-3" />
                                    ) : (
                                      <Lock className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditContent(session, existingContent)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      {existingContent.sectionType === "meet_mentor" && (
                                        <DropdownMenuItem onClick={() => handleAddMentor(existingContent)}>
                                          <User className="mr-2 h-4 w-4" />
                                          Add Mentor
                                        </DropdownMenuItem>
                                      )}
                                      {existingContent.sectionType === "resources" && (
                                        <DropdownMenuItem onClick={() => handleAddResource(existingContent)}>
                                          <FileText className="mr-2 h-4 w-4" />
                                          Add Resource
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteContent(existingContent, existingContent.title)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddContent(session, key)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Display mentors for meet_mentor content */}
                    {session.contents.some(c => c.sectionType === "meet_mentor" && c.mentors && c.mentors.length > 0) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Mentors</p>
                        </div>
                        <div className="space-y-2">
                          {session.contents
                            .filter(c => c.sectionType === "meet_mentor")
                            .flatMap(c => c.mentors || [])
                            .map((mentor) => (
                              <div key={mentor.id} className="border rounded p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {mentor.imageUrl && (
                                    <img
                                      src={mentor.imageUrl}
                                      alt={mentor.name}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">{mentor.name}</p>
                                    {mentor.role && (
                                      <p className="text-xs text-muted-foreground">{mentor.role}</p>
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditMentor(session.contents.find(c => c.sectionType === "meet_mentor")!, mentor)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteMentor(mentor, mentor.name)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Display resources for resources content */}
                    {session.contents.some(c => c.sectionType === "resources" && c.resources && c.resources.length > 0) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Resources</p>
                        </div>
                        <div className="space-y-2">
                          {session.contents
                            .filter(c => c.sectionType === "resources")
                            .flatMap(c => c.resources || [])
                            .map((resource) => (
                              <div key={resource.id} className="border rounded p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-gray-500" />
                                  <div>
                                    <p className="text-sm font-medium">{resource.name}</p>
                                    <p className="text-xs text-muted-foreground">{resource.type}</p>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditResource(session.contents.find(c => c.sectionType === "resources")!, resource)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteResource(resource, resource.name)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Session Edit Dialog */}
        <Dialog open={sessionEditDialogOpen} onOpenChange={setSessionEditDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isAddingSession ? "Add Session" : "Edit Session"}
              </DialogTitle>
            </DialogHeader>
            <Form {...sessionForm}>
              <form onSubmit={sessionForm.handleSubmit(handleSaveSession)} className="space-y-4">
                <FormField
                  control={sessionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter session title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sessionForm.control}
                  name="orderIndex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Index</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSessionEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isAddingSession ? "Add Session" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Content Edit Dialog */}
        <Dialog open={contentEditDialogOpen} onOpenChange={setContentEditDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isAddingContent ? "Add Content" : "Edit Content"}
              </DialogTitle>
            </DialogHeader>
            <Form {...contentForm}>
              <form onSubmit={contentForm.handleSubmit(handleSaveContent)} className="space-y-4">
                <FormField
                  control={contentForm.control}
                  name="sectionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <FormControl>
                        <select
                          className="w-full border rounded px-3 py-2 bg-white"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value as any)}
                          disabled={!isAddingContent}
                        >
                          {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contentForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter content title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {contentForm.watch("sectionType") === "live_session" && (
                  <FormField
                    control={contentForm.control}
                    name="liveSessionLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Live Session Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {contentForm.watch("sectionType") === "recording" && (
                  <>
                    {editingContent && editingContent.videoUrl && (
                      <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-600 mb-2">Current video:</p>
                        <a href={editingContent.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                          {editingContent.videoUrl}
                        </a>
                      </div>
                    )}
                    <FormField
                      control={contentForm.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Upload New Video (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                try {
                                  const response = await fetch("/api/storage/sign-upload", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      domain: "opportunity-attachments",
                                      fileName: file.name,
                                      contentType: file.type,
                                      fileSize: file.size,
                                    }),
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    console.error("Upload API error:", errorData);
                                    throw new Error(errorData.error || "Failed to get upload URL");
                                  }

                                  const { uploadUrl, publicUrl } = await response.json();

                                  const putResponse = await fetch(uploadUrl, {
                                    method: "PUT",
                                    body: file,
                                    headers: {
                                      "Content-Type": file.type,
                                    },
                                  });

                                  if (!putResponse.ok) {
                                    throw new Error(`Upload failed with status ${putResponse.status}`);
                                  }

                                  field.onChange(publicUrl);
                                } catch (error) {
                                  console.error("Error uploading video:", error);
                                  toast.error("Failed to upload video");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {contentForm.watch("sectionType") === "live_session" ||
                contentForm.watch("sectionType") === "resources" ||
                contentForm.watch("sectionType") === "recording" ? (
                  <FormField
                    control={contentForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder="Enter content..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
                <FormField
                  control={contentForm.control}
                  name="isUnlocked"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mb-0">
                        Unlocked (users can see this content)
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {!contentForm.watch("isUnlocked") && (
                  <FormField
                    control={contentForm.control}
                    name="lockedMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Locked Message (shown to users when content is locked)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="This section is locked. It will be unlocked soon!"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={contentForm.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Images (for carousel display)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            try {
                              const uploadPromises = Array.from(files).map(async (file) => {
                                const response = await fetch("/api/storage/sign-upload", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    domain: "opportunity-attachments",
                                    fileName: file.name,
                                    contentType: file.type,
                                    fileSize: file.size,
                                  }),
                                });

                                if (!response.ok) {
                                  const errorData = await response.json();
                                  console.error("Upload API error:", errorData);
                                  throw new Error(errorData.error || "Failed to get upload URL");
                                }

                                const { uploadUrl, publicUrl } = await response.json();

                                const putResponse = await fetch(uploadUrl, {
                                  method: "PUT",
                                  body: file,
                                  headers: {
                                    "Content-Type": file.type,
                                  },
                                });

                                if (!putResponse.ok) {
                                  throw new Error(`Upload failed with status ${putResponse.status}`);
                                }

                                return publicUrl as string;
                              });

                              const uploadedImages = await Promise.all(uploadPromises);
                              field.onChange([...(field.value || []), ...uploadedImages]);
                            } catch (error) {
                              console.error("Error uploading images:", error);
                              toast.error("Failed to upload images");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">You can select multiple images. They will be displayed in carousel in the order selected.</p>
                      {field.value && field.value.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {field.value.map((url, index) => (
                            <div key={index} className="relative">
                              <img
                                src={url}
                                alt={`Uploaded ${index + 1}`}
                                className="h-16 w-16 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = [...(field.value || [])];
                                  newImages.splice(index, 1);
                                  field.onChange(newImages);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setContentEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isAddingContent ? "Add Content" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Mentor Edit Dialog */}
        <Dialog open={mentorEditDialogOpen} onOpenChange={setMentorEditDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isAddingMentor ? "Add Mentor" : "Edit Mentor"}
              </DialogTitle>
            </DialogHeader>
            <Form {...mentorForm}>
              <form onSubmit={mentorForm.handleSubmit(handleSaveMentor)} className="space-y-4">
                <FormField
                  control={mentorForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mentor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mentor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={mentorForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Senior Developer, Product Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={mentorForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            try {
                              const response = await fetch("/api/storage/sign-upload", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  domain: "avatar-images",
                                  fileName: file.name,
                                  contentType: file.type,
                                  fileSize: file.size,
                                }),
                              });

                              if (!response.ok) {
                                const errorData = await response.json();
                                console.error("Upload API error:", errorData);
                                throw new Error(errorData.error || "Failed to get upload URL");
                              }

                              const { uploadUrl, publicUrl } = await response.json();

                              const putResponse = await fetch(uploadUrl, {
                                method: "PUT",
                                body: file,
                                headers: {
                                  "Content-Type": file.type,
                                },
                              });

                              if (!putResponse.ok) {
                                throw new Error(`Upload failed with status ${putResponse.status}`);
                              }

                              field.onChange(publicUrl);
                            } catch (error) {
                              console.error("Error uploading photo:", error);
                              toast.error("Failed to upload photo");
                            }
                          }}
                        />
                      </FormControl>
                      {field.value && (
                        <div className="mt-2">
                          <img
                            src={field.value}
                            alt="Mentor preview"
                            className="h-20 w-20 rounded-full object-cover border"
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={mentorForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description/Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter mentor description..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={mentorForm.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={mentorForm.control}
                  name="orderIndex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Index</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMentorEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isAddingMentor ? "Add Mentor" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Resource Edit Dialog */}
        <Dialog open={resourceEditDialogOpen} onOpenChange={setResourceEditDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isAddingResource ? "Add Resource" : "Edit Resource"}
              </DialogTitle>
            </DialogHeader>
            <Form {...resourceForm}>
              <form onSubmit={resourceForm.handleSubmit(handleSaveResource)} className="space-y-4">
                <FormField
                  control={resourceForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter resource name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resourceForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Type</FormLabel>
                      <FormControl>
                        <select
                          className="w-full border rounded px-3 py-2 bg-white"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value as any)}
                        >
                          <option value="pdf">PDF</option>
                          <option value="ppt">Presentation (PPT)</option>
                          <option value="link">Link</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {resourceForm.watch("type") === "link" ? (
                  <FormField
                    control={resourceForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={resourceForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload File</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept={
                              resourceForm.watch("type") === "pdf"
                                ? ".pdf"
                                : resourceForm.watch("type") === "ppt"
                                ? ".ppt,.pptx"
                                : "*"
                            }
                            multiple
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;

                              try {
                                const uploadPromises = Array.from(files).map(async (file) => {
                                  const response = await fetch("/api/storage/sign-upload", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      domain: "opportunity-attachments",
                                      fileName: file.name,
                                      contentType: file.type,
                                      fileSize: file.size,
                                    }),
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    console.error("Upload API error:", errorData);
                                    throw new Error(errorData.error || "Failed to get upload URL");
                                  }

                                  const { uploadUrl, publicUrl } = await response.json();

                                  const putResponse = await fetch(uploadUrl, {
                                    method: "PUT",
                                    body: file,
                                    headers: {
                                      "Content-Type": file.type,
                                    },
                                  });

                                  if (!putResponse.ok) {
                                    throw new Error(`Upload failed with status ${putResponse.status}`);
                                  }

                                  return {
                                    name: file.name,
                                    url: publicUrl,
                                    type: resourceForm.watch("type"),
                                  };
                                });

                                const uploadedResources = await Promise.all(uploadPromises);
                                field.onChange(JSON.stringify(uploadedResources));
                              } catch (error) {
                                console.error("Error uploading files:", error);
                                toast.error("Failed to upload files");
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">You can select multiple files</p>
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={resourceForm.control}
                  name="orderIndex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Index</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResourceEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isAddingResource ? "Add Resource" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
