"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Edit, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import NewUngatekeepForm from "@/components/ungatekeep/NewUngatekeepForm";
import { stripHtml } from "@/lib/utils";

interface UngatekeepPost {
  id: string;
  content: string;
  attachments: string[];
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkImage?: string | null;
  videoUrl?: string | null;
  tag?: "announcement" | "company_experience" | "resources" | "playbooks" | "college_hacks" | "interview" | "ama_drops" | "ftb_recommends" | null;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  creatorName?: string | null;
}

async function fetchPosts(): Promise<UngatekeepPost[]> {
  const response = await axios.get("/api/admin/ungatekeep");
  return (response as any).data;
}

export default function AdminUngatekeepTable() {
  const queryClient = useQueryClient();

  const {
    data: posts = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin", "ungatekeep"],
    queryFn: fetchPosts,
    staleTime: 1000 * 30,
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => {
      await axios.put(`/api/admin/ungatekeep/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ungatekeep"] });
    },
    onError: () => {
      toast.error("Failed to update post");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/ungatekeep/${id}`);
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "ungatekeep"] });
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const columns = useMemo<ColumnDef<UngatekeepPost>[]>(() => {
    return [
      {
        accessorKey: "content",
        header: "Content",
        cell: ({ row }) => {
          const content = stripHtml(row.original.content);
          return (
            <div className="max-w-[300px] truncate" title={content}>
              {content}
            </div>
          );
        },
      },
      {
        accessorKey: "tag",
        header: "Tag",
        cell: ({ row }) => {
          const tag = row.original.tag;
          if (!tag) {
            return <span className="text-muted-foreground text-sm">-</span>;
          }

          const variant =
            tag === "announcement"
              ? "default"
              : tag === "company_experience"
                ? "secondary"
                : tag === "resources"
                  ? "outline"
                  : tag === "playbooks"
                    ? "default"
                    : tag === "college_hacks"
                      ? "secondary"
                      : tag === "interview"
                        ? "destructive"
                        : "outline";
          return <Badge variant={variant}>{tag.replace("_", " ")}</Badge>;
        },
      },
      {
        accessorKey: "isPublished",
        header: "Status",
        cell: ({ row }) => {
          const isPublished = row.original.isPublished;
          const publishedAt = row.original.publishedAt;
          const isScheduled =
            isPublished && publishedAt && new Date(publishedAt) > new Date();

          if (isScheduled) {
            return (
              <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                Scheduled
              </Badge>
            );
          }

          return (
            <Badge
              className={
                isPublished
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50"
              }
            >
              {isPublished ? "Published" : "Draft"}
            </Badge>
          );
        },
      },
      {
        id: "pinned",
        header: "Pinned",
        enableSorting: false,
        cell: ({ row }) => (
          <Switch
            checked={row.original.isPinned}
            onCheckedChange={() =>
              updatePostMutation.mutate({
                id: row.original.id,
                payload: { isPinned: !row.original.isPinned },
              })
            }
          />
        ),
      },
      {
        id: "published",
        header: "Published",
        enableSorting: false,
        cell: ({ row }) => (
          <Switch
            checked={row.original.isPublished}
            onCheckedChange={() =>
              updatePostMutation.mutate({
                id: row.original.id,
                payload: { isPublished: !row.original.isPublished },
              })
            }
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="flex items-center gap-2">
              <NewUngatekeepForm
                post={{
                  id: post.id,
                  content: post.content,
                  attachments: post.attachments,
                  linkUrl: post.linkUrl,
                  linkTitle: post.linkTitle,
                  linkImage: post.linkImage,
                  videoUrl: post.videoUrl,
                  tag: post.tag,
                  isPinned: post.isPinned,
                  isPublished: post.isPublished,
                  publishedAt: post.publishedAt,
                }}
                isEdit
                onSuccess={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["admin", "ungatekeep"],
                  })
                }
              >
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </NewUngatekeepForm>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (
                    !confirm(`Are you sure you want to delete this post?`)
                  ) {
                    return;
                  }
                  deletePostMutation.mutate(post.id);
                }}
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [deletePostMutation, queryClient, updatePostMutation]);

  return (
    <AdminTabLayout
      title="Ungatekeep Posts"
      description="Manage announcements, resources, and post visibility"
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <NewUngatekeepForm
            onSuccess={() =>
              queryClient.invalidateQueries({
                queryKey: ["admin", "ungatekeep"],
              })
            }
          >
            <Button>Create Post</Button>
          </NewUngatekeepForm>
        </>
      }
      stats={
        <p className="text-muted-foreground text-sm">
          Total posts:{" "}
          <span className="text-foreground font-medium">{posts.length}</span>
        </p>
      }
    >
      <AdminTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!posts.length}
        emptyMessage="No posts found. Create your first post."
        errorMessage="Failed to fetch posts"
      >
        <AdminDataTable
          tableId="ungatekeep"
          columns={columns}
          data={posts}
          emptyMessage="No posts found"
          filterColumnId="content"
          filterPlaceholder="Search posts"
          stickyColumnIds={["actions"]}
        />
      </AdminTableState>
    </AdminTabLayout>
  );
}
