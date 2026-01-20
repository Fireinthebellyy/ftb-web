"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import NewUngatekeepForm from "@/components/ungatekeep/NewUngatekeepForm";
import { Edit, Trash2 } from "lucide-react";

type UngatekeepPost = {
    id: string;
    title: string;
    content: string;
    images: string[];
    linkUrl?: string | null;
    linkTitle?: string | null;
    linkImage?: string | null;
    tag?: "announcement" | "company_experience" | "resources" | null;
    isPinned: boolean;
    isPublished: boolean;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    creatorName?: string | null;
};

export default function AdminUngatekeepTable() {
    const [posts, setPosts] = useState<UngatekeepPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/admin/ungatekeep");
            setPosts(response.data);
        } catch (error) {
            console.error("Error fetching posts:", error);
            toast.error("Failed to fetch posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

        try {
            await axios.delete(`/api/admin/ungatekeep/${id}`);
            toast.success("Post deleted successfully!");
            fetchPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Failed to delete post");
        }
    };

    const handleTogglePinned = async (id: string, isPinned: boolean) => {
        try {
            await axios.put(`/api/admin/ungatekeep/${id}`, { isPinned: !isPinned });
            toast.success(`Post ${!isPinned ? "pinned" : "unpinned"}`);
            fetchPosts();
        } catch (error) {
            console.error("Error toggling pin status:", error);
            toast.error("Failed to update pin status");
        }
    };

    const handleTogglePublished = async (id: string, isPublished: boolean) => {
        try {
            await axios.put(`/api/admin/ungatekeep/${id}`, {
                isPublished: !isPublished,
            });
            toast.success(`Post ${!isPublished ? "published" : "unpublished"}`);
            fetchPosts();
        } catch (error) {
            console.error("Error toggling publish status:", error);
            toast.error("Failed to update publish status");
        }
    };

    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    const getTagBadgeVariant = (tag: string | null | undefined) => {
        switch (tag) {
            case "announcement":
                return "default";
            case "company_experience":
                return "secondary";
            case "resources":
                return "outline";
            default:
                return "outline";
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Ungatekeep Posts</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchPosts} disabled={loading}>
                        Refresh
                    </Button>
                    <NewUngatekeepForm onSuccess={fetchPosts}>
                        <Button>Create Post</Button>
                    </NewUngatekeepForm>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading posts...</div>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Content</TableHead>
                                <TableHead>Tag</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Pinned</TableHead>
                                <TableHead>Published</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No posts found. Create your first post!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className="text-sm text-muted-foreground truncate">
                                                {truncateText(post.content)}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            {post.tag ? (
                                                <Badge variant={getTagBadgeVariant(post.tag)}>
                                                    {post.tag.replace("_", " ")}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={post.isPublished ? "default" : "secondary"}
                                            >
                                                {post.isPublished ? "Published" : "Draft"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={post.isPinned}
                                                onCheckedChange={() =>
                                                    handleTogglePinned(post.id, post.isPinned)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={post.isPublished}
                                                onCheckedChange={() =>
                                                    handleTogglePublished(post.id, post.isPublished)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <NewUngatekeepForm
                                                    post={{
                                                        id: post.id,
                                                        title: post.title,
                                                        content: post.content,
                                                        images: post.images,
                                                        linkUrl: post.linkUrl,
                                                        linkTitle: post.linkTitle,
                                                        linkImage: post.linkImage,
                                                        tag: post.tag,
                                                        isPinned: post.isPinned,
                                                        isPublished: post.isPublished,
                                                    }}
                                                    isEdit
                                                    onSuccess={fetchPosts}
                                                >
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </NewUngatekeepForm>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(post.id, post.title)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
