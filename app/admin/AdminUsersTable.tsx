"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRole = "user" | "member" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: Date | string;
  emailVerified: boolean;
}

async function fetchUsers(): Promise<User[]> {
  const response = await axios.get<{ users: User[] }>("/api/admin/users");
  return response.data.users;
}

interface AdminUsersTableProps {
  currentUserId: string;
}

export default function AdminUsersTable({
  currentUserId,
}: AdminUsersTableProps) {
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchUsers,
    staleTime: 1000 * 30,
    retry: false,
  });

  useEffect(() => {
    if (error && axios.isAxiosError(error) && error.response?.status === 403) {
      router.push("/");
      toast.error("You don't have permission to access this page");
      return;
    }

    if (error) {
      toast.error("Failed to load users");
    }
  }, [error, router]);

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: UserRole;
    }) => {
      const response = await axios.patch(`/api/admin/users/${userId}`, {
        role: newRole,
      });
      return { userId, newRole, user: response.data.user };
    },
    onMutate: ({ userId }) => {
      setUpdatingRoles((prev) => new Set(prev).add(userId));
    },
    onSuccess: ({ userId, newRole }) => {
      queryClient.setQueryData<User[]>(["admin", "users"], (oldUsers = []) =>
        oldUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      toast.success(`User role updated to ${newRole}`);
    },
    onError: (mutationError) => {
      if (axios.isAxiosError(mutationError)) {
        const message =
          mutationError.response?.data?.error || "Failed to update user role";
        toast.error(message);
      } else {
        toast.error("Failed to update user role");
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onSettled: (_data, _error, variables) => {
      setUpdatingRoles((prev) => {
        const next = new Set(prev);
        next.delete(variables.userId);
        return next;
      });
    },
  });

  const columns = useMemo<ColumnDef<User>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              {user.image ? (
                <div className="rounded-full border-2 border-white shadow-sm">
                  <Image
                    src={user.image}
                    alt={user.name || "User avatar"}
                    className="size-6 rounded-full object-cover"
                    width={24}
                    height={24}
                  />
                </div>
              ) : (
                <div className="flex size-6 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-200 text-xs font-semibold text-neutral-600 uppercase">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              <span className="font-medium">{user.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.original.role;

          const roleBadgeClassName =
            role === "admin"
              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50"
              : role === "member"
                ? "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50";

          return <Badge className={roleBadgeClassName}>{role}</Badge>;
        },
      },
      {
        accessorKey: "emailVerified",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.emailVerified
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50"
            }
          >
            {row.original.emailVerified ? "Verified" : "Unverified"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Select
              value={user.role}
              onValueChange={(value) =>
                updateRoleMutation.mutate({
                  userId: user.id,
                  newRole: value as UserRole,
                })
              }
              disabled={updatingRoles.has(user.id) || user.id === currentUserId}
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
          );
        },
      },
    ];
  }, [currentUserId, updateRoleMutation, updatingRoles]);

  return (
    <AdminTabLayout
      title="User Management"
      description="Manage user roles and permissions"
      stats={
        <p className="text-muted-foreground text-sm">
          Total users:{" "}
          <span className="text-foreground font-medium">{users.length}</span>
        </p>
      }
    >
      <AdminTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!users.length}
        emptyMessage="No users found"
        errorMessage="Failed to load users"
      >
        <AdminDataTable
          columns={columns}
          data={users}
          emptyMessage="No users found"
          filterColumnId="name"
          filterPlaceholder="Search users by name"
        />
      </AdminTableState>
    </AdminTabLayout>
  );
}
