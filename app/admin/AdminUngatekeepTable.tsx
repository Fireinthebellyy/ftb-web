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
import { cn, stripHtml } from "@/lib/utils";

interface UngatekeepPost {
  id: string;
  content: string;
  attachments: string[];
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkImage?: string | null;
  videoUrl?: string | null;
  tag?: string | null;
  isPinned: boolean;
  isPublished: boolean;
  is_trending: boolean;
  is_featured_home: boolean;
  trending_index?: number;
  featured_home_index?: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  creatorName?: string | null;
  toolkitId?: string | null;
}

async function fetchPosts(): Promise<UngatekeepPost[]> {
  const response = await axios.get("/api/admin/ungatekeep");
  return (response as any).data;
}

function OrangeCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="relative inline-flex cursor-pointer">
      <input type="checkbox" checked={checked} className="sr-only" onChange={onChange} />
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
          checked
            ? "border-orange-500 bg-orange-500"
            : "border-gray-300 bg-white hover:border-orange-300"
        )}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,6 4.5,9 10.5,3" />
          </svg>
        )}
      </span>
    </label>
  );
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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "ungatekeep"] });
      const previous = queryClient.getQueryData<UngatekeepPost[]>(["admin", "ungatekeep"]);
      queryClient.setQueryData<UngatekeepPost[]>(["admin", "ungatekeep"], (old) =>
        old?.map((post) =>
          post.id === id ? { ...post, ...payload } : post
        ) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin", "ungatekeep"], context.previous);
      }
      toast.error("Failed to update post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ungatekeep"] });
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
          
          const getTagBadgeVariant = (t: string) => {
            switch (t.toLowerCase()) {
              case "announcement":
                return "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200";
              case "company_experience":
                return "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200";
              case "resources":
                return "bg-green-100 text-green-700 hover:bg-green-100 border-green-200";
              case "playbooks":
                return "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200";
              case "college_hacks":
                return "bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200";
              case "interview":
                return "bg-red-100 text-red-700 hover:bg-red-100 border-red-200";
              case "ama_drops":
                return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200";
              case "ftb_recommends":
                return "bg-teal-100 text-teal-700 hover:bg-teal-100 border-teal-200";
              default:
                return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200";
            }
          };

          return (
            <Badge 
              variant="outline" 
              className={cn("font-medium", getTagBadgeVariant(tag))}
            >
              {tag.replace("_", " ")}
            </Badge>
          );
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
        id: "trending",
        header: "Trending",
        enableSorting: false,
        cell: ({ row }) => (
          <OrangeCheckbox
            checked={row.original.is_trending ?? false}
            onChange={() =>
              updatePostMutation.mutate({
                id: row.original.id,
                payload: { is_trending: !row.original.is_trending },
              })
            }
          />
        ),
      },
      {
        id: "featuredHome",
        header: "Featured Home",
        enableSorting: false,
        cell: ({ row }) => (
          <OrangeCheckbox
            checked={row.original.is_featured_home ?? false}
            onChange={() =>
              updatePostMutation.mutate({
                id: row.original.id,
                payload: { is_featured_home: !row.original.is_featured_home },
              })
            }
          />
        ),
      },
      {
        accessorKey: "trending_index",
        header: "Trending Index",
        cell: ({ row }) => {
          const post = row.original;
          return (
            <input
              key={`trending-${post.id}-${post.trending_index}`}
              type="number"
              defaultValue={post.trending_index ?? ""}
              className="border rounded px-2 py-1 text-sm w-[80px]"
              onBlur={async (e) => {
                const raw = e.target.value;
                try {
                  await axios.put(`/api/admin/ungatekeep/${post.id}`, {
                    trending_index: raw === "" ? null : Number(raw),
                  });
                  toast.success("Trending index updated");
                } catch {
                  toast.error("Failed to update trending index");
                } finally {
                  queryClient.invalidateQueries({
                    queryKey: ["admin", "ungatekeep"],
                  });
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "featured_home_index",
        header: "Featured Index",
        cell: ({ row }) => {
          const post = row.original;
          return (
            <input
              key={`featured-${post.id}-${post.featured_home_index}`}
              type="number"
              defaultValue={post.featured_home_index ?? ""}
              className="border rounded px-2 py-1 text-sm w-[80px]"
              onBlur={async (e) => {
                const raw = e.target.value;
                try {
                  await axios.put(`/api/admin/ungatekeep/${post.id}`, {
                    featured_home_index: raw === "" ? null : Number(raw),
                  });
                  toast.success("Featured index updated");
                } catch {
                  toast.error("Failed to update featured index");
                } finally {
                  queryClient.invalidateQueries({
                    queryKey: ["admin", "ungatekeep"],
                  });
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "toolkitId",
        header: "Toolkit",
        cell: ({ row }) => {
          const toolkitId = row.original.toolkitId;
          if (!toolkitId) return <span className="text-muted-foreground text-xs">-</span>;
          return (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px]">
              Linked
            </Badge>
          );
        },
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
                  toolkitId: post.toolkitId,
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
                  if (!confirm(`Are you sure you want to delete this post?`)) {
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
          data={[...posts].sort((a, b) => {
            const aFeatured = a.featured_home_index ?? 9999;
            const bFeatured = b.featured_home_index ?? 9999;

            if (aFeatured !== bFeatured) return aFeatured - bFeatured;

            const aTrending = a.trending_index ?? 9999;
            const bTrending = b.trending_index ?? 9999;

            if (aTrending !== bTrending) return aTrending - bTrending;

            return 0;
          })}
          emptyMessage="No posts found"
          filterFields={["content", "createdAt", "trending_index", "featured_home_index"]}
          filterPlaceholder="Search by content, date, or index"
          stickyColumnIds={["actions"]}
        />
      </AdminTableState>
    </AdminTabLayout>
  );
}