"use client";

import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  maxUses: number | null;
  maxUsesPerUser: number;
  currentUses: number;
  isActive: boolean;
  expiresAt: Date | string | null;
  createdAt: Date | string;
}

const couponFormSchema = z.object({
  code: z.string().min(1).max(50),
  discountAmount: z.number().int().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional(),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

async function fetchCoupons(): Promise<Coupon[]> {
  const response = await axios.get<{ coupons: Coupon[] }>("/api/admin/coupons");
  return response.data.coupons;
}

export default function AdminCouponsTable() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const queryClient = useQueryClient();

  const {
    data: coupons = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: fetchCoupons,
    staleTime: 1000 * 30,
  });

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      discountAmount: 0,
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      expiresAt: undefined,
    },
  });

  const saveCouponMutation = useMutation({
    mutationFn: async (data: CouponFormValues) => {
      const payload = {
        ...data,
        expiresAt:
          data.expiresAt && data.expiresAt.trim()
            ? new Date(data.expiresAt).toISOString()
            : null,
      };

      if (editingCoupon) {
        await axios.patch(`/api/admin/coupons/${editingCoupon.id}`, payload);
        return "updated";
      }

      await axios.post("/api/admin/coupons", payload);
      return "created";
    },
    onSuccess: (status) => {
      toast.success(`Coupon ${status} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setDialogOpen(false);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to save coupon");
      } else {
        toast.error("Failed to save coupon");
      }
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      await axios.delete(`/api/admin/coupons/${couponId}`);
    },
    onSuccess: () => {
      toast.success("Coupon deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to delete coupon");
      } else {
        toast.error("Failed to delete coupon");
      }
    },
  });

  const handleEdit = useCallback(
    (coupon: Coupon) => {
      setEditingCoupon(coupon);
      form.reset({
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        maxUses: coupon.maxUses ?? null,
        maxUsesPerUser: coupon.maxUsesPerUser,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt
          ? new Date(coupon.expiresAt).toISOString().slice(0, 16)
          : undefined,
      });
      setDialogOpen(true);
    },
    [form]
  );

  const handleCreate = () => {
    setEditingCoupon(null);
    form.reset({
      code: "",
      discountAmount: 0,
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      expiresAt: undefined,
    });
    setDialogOpen(true);
  };

  const columns = useMemo<ColumnDef<Coupon>[]>(() => {
    return [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono font-semibold">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "discountAmount",
        header: "Discount",
        cell: ({ row }) => `₹${row.original.discountAmount}`,
      },
      {
        id: "usage",
        header: "Usage",
        cell: ({ row }) =>
          row.original.maxUses !== null
            ? `${row.original.currentUses} / ${row.original.maxUses}`
            : `${row.original.currentUses} / ∞`,
      },
      {
        accessorKey: "maxUsesPerUser",
        header: "Per User Limit",
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.isActive
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50"
            }
          >
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => {
          if (!row.original.expiresAt) {
            return "Never";
          }

          return new Date(row.original.expiresAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!confirm("Are you sure you want to delete this coupon?")) {
                  return;
                }
                deleteCouponMutation.mutate(row.original.id);
              }}
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, [deleteCouponMutation, handleEdit]);

  return (
    <AdminTabLayout
      title="Coupons"
      description="Create and manage discount coupons"
      actions={
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      }
      stats={
        <p className="text-muted-foreground text-sm">
          Total coupons:{" "}
          <span className="text-foreground font-medium">{coupons.length}</span>
        </p>
      }
    >
      <AdminTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!coupons.length}
        emptyMessage="No coupons found"
        errorMessage="Failed to load coupons"
      >
        <AdminDataTable
          tableId="coupons"
          columns={columns}
          data={coupons}
          emptyMessage="No coupons found"
          filterColumnId="code"
          filterPlaceholder="Search coupon code"
        />
      </AdminTableState>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit((values) =>
              saveCouponMutation.mutate(values)
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="SAVE100"
                className="uppercase"
                onChange={(event) =>
                  form.setValue("code", event.target.value.toUpperCase())
                }
              />
              {form.formState.errors.code ? (
                <p className="text-destructive text-sm">
                  {form.formState.errors.code.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount Amount (INR)</Label>
              <Input
                id="discountAmount"
                type="number"
                {...form.register("discountAmount", { valueAsNumber: true })}
                placeholder="100"
              />
              {form.formState.errors.discountAmount ? (
                <p className="text-destructive text-sm">
                  {form.formState.errors.discountAmount.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">
                Max Total Uses (leave empty for unlimited)
              </Label>
              <Input
                id="maxUses"
                type="number"
                {...form.register("maxUses", {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                placeholder="100"
              />
              {form.formState.errors.maxUses ? (
                <p className="text-destructive text-sm">
                  {form.formState.errors.maxUses.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
              <Input
                id="maxUsesPerUser"
                type="number"
                {...form.register("maxUsesPerUser", { valueAsNumber: true })}
                placeholder="1"
              />
              {form.formState.errors.maxUsesPerUser ? (
                <p className="text-destructive text-sm">
                  {form.formState.errors.maxUsesPerUser.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires At (optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                {...form.register("expiresAt")}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked)
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveCouponMutation.isPending}>
                {editingCoupon ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminTabLayout>
  );
}
