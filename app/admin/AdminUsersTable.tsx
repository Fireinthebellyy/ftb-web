"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type User = {
    id: string;
    name: string;
    email: string;
    role: "user" | "member" | "admin";
    image: string | null;
    createdAt: Date | string;
    emailVerified: boolean;
};

export default function AdminUsersTable({ currentUserId }: { currentUserId: string }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());
    const router = useRouter();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get("/api/admin/users");
            if (response.status === 200) {
                setUsers(response.data.users);
            } else if (response.status === 403) {
                router.push("/");
                toast.error("You don't have permission to access this page");
            }
        } catch (error) {
            console.error("Error:", error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    router.push("/");
                    toast.error("You don't have permission to access this page");
                } else {
                    toast.error("Failed to load users");
                }
            } else {
                toast.error("Failed to load users");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: "user" | "member" | "admin") => {
        setUpdatingRoles((prev) => new Set(prev).add(userId));
        try {
            const response = await axios.patch(`/api/admin/users/${userId}`, {
                role: newRole,
            });

            if (response.status === 200) {
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === userId ? { ...user, role: newRole } : user
                    )
                );
                toast.success(`User role updated to ${newRole}`);
            }
        } catch (error) {
            console.error("Error updating role:", error);
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || "Failed to update user role";
                toast.error(message);
            } else {
                toast.error("Failed to update user role");
            }
        } finally {
            setUpdatingRoles((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "admin":
                return "destructive";
            case "member":
                return "default";
            default:
                return "secondary";
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Manage user roles and permissions
                </p>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            Total Users: <span className="font-semibold">{users.length}</span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={user.image || undefined} alt={user.name} />
                                                        <AvatarFallback>
                                                            {user.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()
                                                                .slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.emailVerified ? "default" : "outline"}>
                                                    {user.emailVerified ? "Verified" : "Unverified"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(value) =>
                                                        handleRoleChange(user.id, value as "user" | "member" | "admin")
                                                    }
                                                    disabled={
                                                        updatingRoles.has(user.id) ||
                                                        user.id === currentUserId
                                                    }
                                                >
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="user">User</SelectItem>
                                                        <SelectItem value="member">Member</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
