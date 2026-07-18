
/* eslint-disable max-lines */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  discountType?: "fixed" | "percentage";
  maxUses: number | null;
  maxUsesPerUser: number;
  currentUses: number;
  isActive: boolean;
  cohortOnly: boolean;
  expiresAt: Date | string | null;
  createdAt: Date | string;
}

const couponFormSchema = z.object({
  code: z.string().min(1).max(50),
  discountAmount: z.number().int().positive(),
  discountType: z.enum(["fixed", "percentage"]).default("fixed"),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  cohortOnly: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

const bulkCouponFormSchema = z.object({
  codes: z.string().min(1, "Enter at least one coupon code"),
  discountAmount: z.number().int().positive(),
  discountType: z.enum(["fixed", "percentage"]).default("fixed"),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  cohortOnly: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;
type BulkCouponFormValues = z.infer<typeof bulkCouponFormSchema>;

async function fetchCoupons(): Promise<Coupon[]> {
  const response = await axios.get<{ coupons: Coupon[] }>("/api/admin/coupons");
  return response.data.coupons;
}
function DiscountCell({ coupon, queryClient }: { coupon: Coupon; queryClient: any }) {
  const [type, setType] = useState<"fixed" | "percentage">(
    coupon.discountType ?? "fixed"
  );

  const handleTypeChange = async (value: "fixed" | "percentage") => {
    setType(value);
    await axios.patch(`/api/admin/coupons/${coupon.id}`, {
      discountType: value,
    });
    queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
  };

  return (
    <div className="flex items-center gap-1">
      <span>
        {type === "percentage"
          ? `${coupon.discountAmount}%`
          : `₹${coupon.discountAmount}`}
      </span>
      <Select value={type} onValueChange={handleTypeChange}>
        <SelectTrigger className="h-6 w-[75px] text-xs px-1 border-none shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fixed">₹ Fixed</SelectItem>
          <SelectItem value="percentage">% Off</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
export default function AdminCouponsTable() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
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
      discountType: "fixed",
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      cohortOnly: false,
      expiresAt: undefined,
    },
  });

  const bulkForm = useForm<BulkCouponFormValues>({
    resolver: zodResolver(bulkCouponFormSchema),
    defaultValues: {
      codes: "",
      discountAmount: 0,
      discountType: "fixed",
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      cohortOnly: false,
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
      if ((error as any).isAxiosError) {
        toast.error((error as any).response?.data?.error || "Failed to save coupon");
      } else {
        toast.error("Failed to save coupon");
      }
    },
  });

  const saveBulkCouponMutation = useMutation({
    mutationFn: async (data: BulkCouponFormValues) => {
      const payload = {
        ...data,
        codes: data.codes.split(",").map(c => c.trim()).filter(c => c.length > 0),
        expiresAt:
          data.expiresAt && data.expiresAt.trim()
            ? new Date(data.expiresAt).toISOString()
            : null,
      };

      const response = await axios.post("/api/admin/coupons", payload);
      return response.data.coupons?.length || 0;
    },
    onSuccess: (count) => {
      toast.success(`${count} coupons created successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setDialogOpen(false);
      setIsBulkMode(false);
    },
    onError: (error) => {
      if ((error as any).isAxiosError) {
        toast.error((error as any).response?.data?.error || "Failed to create bulk coupons");
      } else {
        toast.error("Failed to create bulk coupons");
      }
    },
  });

  const saveBulkEditMutation = useMutation({
    mutationFn: async (data: BulkCouponFormValues) => {
      const payload: any = {
        couponIds: selectedCouponIds,
      };

      if (data.discountAmount !== undefined && data.discountAmount !== 0) {
        payload.discountAmount = data.discountAmount;
      }
      if (data.discountType) {
        payload.discountType = data.discountType;
      }
      if (data.maxUses !== undefined) {
        payload.maxUses = data.maxUses;
      }
      if (data.maxUsesPerUser !== undefined && data.maxUsesPerUser !== 1) {
        payload.maxUsesPerUser = data.maxUsesPerUser;
      }
      if (data.isActive !== undefined) {
        payload.isActive = data.isActive;
      }
      if (data.cohortOnly !== undefined) {
        payload.cohortOnly = data.cohortOnly;
      }
      if (data.expiresAt) {
        payload.expiresAt = new Date(data.expiresAt).toISOString();
      }

      const response = await axios.post("/api/admin/coupons", payload);
      return response.data.coupons?.length || 0;
    },
    onSuccess: (count) => {
      toast.success(`${count} coupons updated successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setDialogOpen(false);
      setIsBulkEditMode(false);
      setSelectedCouponIds([]);
    },
    onError: (error) => {
      if ((error as any).isAxiosError) {
        toast.error((error as any).response?.data?.error || "Failed to update bulk coupons");
      } else {
        toast.error("Failed to update bulk coupons");
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
      if ((error as any).isAxiosError) {
        toast.error((error as any).response?.data?.error || "Failed to delete coupon");
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
        discountType: coupon.discountType ?? "fixed",
        maxUses: coupon.maxUses ?? null,
        maxUsesPerUser: coupon.maxUsesPerUser,
        isActive: coupon.isActive,
        cohortOnly: coupon.cohortOnly,
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
    setIsBulkMode(false);
    form.reset({
      code: "",
      discountAmount: 0,
      discountType: "fixed",
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      cohortOnly: false,
      expiresAt: undefined,
    });
    bulkForm.reset({
      codes: "",
      discountAmount: 0,
      discountType: "fixed",
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      cohortOnly: false,
      expiresAt: undefined,
    });
    setDialogOpen(true);
  };

  const handleBulkCreate = () => {
    setEditingCoupon(null);
    setIsBulkMode(true);
    setIsBulkEditMode(false);
    bulkForm.reset({
      codes: "",
      discountAmount: 0,
      discountType: "fixed",
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      cohortOnly: false,
      expiresAt: undefined,
    });
    setDialogOpen(true);
  };

  const handleBulkEdit = () => {
    setEditingCoupon(null);
    setIsBulkMode(true);
    setIsBulkEditMode(true);
    // Pre-fill with values from first selected coupon
    const firstCoupon = coupons.find(c => c.id === selectedCouponIds[0]);
    if (firstCoupon) {
      bulkForm.reset({
        codes: "",
        discountAmount: firstCoupon.discountAmount,
        discountType: firstCoupon.discountType ?? "fixed",
        maxUses: firstCoupon.maxUses,
        maxUsesPerUser: firstCoupon.maxUsesPerUser,
        isActive: firstCoupon.isActive,
        cohortOnly: firstCoupon.cohortOnly,
        expiresAt: firstCoupon.expiresAt
          ? new Date(firstCoupon.expiresAt).toISOString().slice(0, 16)
          : undefined,
      });
    }
    setDialogOpen(true);
  };

  const handleSelectCoupon = (couponId: string) => {
    setSelectedCouponIds(prev =>
      prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
  };

  const columns = useMemo<ColumnDef<Coupon>[]>(() => {
    return [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={selectedCouponIds.length === coupons.length && coupons.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCouponIds(coupons.map(c => c.id));
              } else {
                setSelectedCouponIds([]);
              }
            }}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedCouponIds.includes(row.original.id)}
            onChange={() => handleSelectCoupon(row.original.id)}
            className="rounded border-gray-300"
          />
        ),
      },
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
        cell: ({ row }) => <DiscountCell coupon={row.original} queryClient={queryClient} />,
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
          if (!row.original.expiresAt) return "Never";
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
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!confirm("Are you sure you want to delete this coupon?")) return;
                deleteCouponMutation.mutate(row.original.id);
              }}
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, [deleteCouponMutation, handleEdit, queryClient]);

  return (
    <AdminTabLayout
      title="Coupons"
      description="Create and manage discount coupons"
      actions={
        <div className="flex gap-2">
          {selectedCouponIds.length > 0 && (
            <Button onClick={handleBulkEdit} variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit {selectedCouponIds.length} Selected
            </Button>
          )}
          <Button onClick={handleBulkCreate} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Bulk Create
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Coupon
          </Button>
        </div>
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
              {editingCoupon ? "Edit Coupon" : isBulkEditMode ? `Edit ${selectedCouponIds.length} Coupons` : isBulkMode ? "Bulk Create Coupons" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>

          {isBulkMode ? (
            <form
              onSubmit={bulkForm.handleSubmit((values) =>
                isBulkEditMode ? saveBulkEditMutation.mutate(values) : saveBulkCouponMutation.mutate(values)
              )}
              className="space-y-4"
            >
              {!isBulkEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="codes">Coupon Codes (comma separated)</Label>
                  <Textarea
                    id="codes"
                    {...bulkForm.register("codes")}
                    placeholder="SAVE100, SAVE200, SAVE300"
                    className="uppercase min-h-[100px]"
                    onChange={(event) =>
                      bulkForm.setValue("codes", event.target.value.toUpperCase())
                    }
                  />
                  {bulkForm.formState.errors.codes && (
                    <p className="text-destructive text-sm">
                      {bulkForm.formState.errors.codes.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter multiple coupon codes separated by commas. All codes will share the same discount settings.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Discount</Label>
                <div className="flex gap-2">
                  <Input
                    id="discountAmount"
                    type="number"
                    {...bulkForm.register("discountAmount", { valueAsNumber: true })}
                    placeholder="100"
                    className="flex-1"
                  />
                  <Select
                    value={bulkForm.watch("discountType")}
                    onValueChange={(value) =>
                      bulkForm.setValue("discountType", value as "fixed" | "percentage")
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">₹ Fixed</SelectItem>
                      <SelectItem value="percentage">% Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {bulkForm.formState.errors.discountAmount && (
                  <p className="text-destructive text-sm">
                    {bulkForm.formState.errors.discountAmount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Total Uses (leave empty for unlimited)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  {...bulkForm.register("maxUses", {
                    valueAsNumber: true,
                    setValueAs: (value) => (value === "" ? null : Number(value)),
                  })}
                  placeholder="100"
                />
                {bulkForm.formState.errors.maxUses && (
                  <p className="text-destructive text-sm">
                    {bulkForm.formState.errors.maxUses.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
                <Input
                  id="maxUsesPerUser"
                  type="number"
                  {...bulkForm.register("maxUsesPerUser", { valueAsNumber: true })}
                  placeholder="1"
                />
                {bulkForm.formState.errors.maxUsesPerUser && (
                  <p className="text-destructive text-sm">
                    {bulkForm.formState.errors.maxUsesPerUser.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  {...bulkForm.register("expiresAt")}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={bulkForm.watch("isActive")}
                  onCheckedChange={(checked) => bulkForm.setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="cohortOnly"
                  checked={bulkForm.watch("cohortOnly")}
                  onCheckedChange={(checked) => bulkForm.setValue("cohortOnly", checked)}
                />
                <Label htmlFor="cohortOnly">Cohort Only</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveBulkCouponMutation.isPending || saveBulkEditMutation.isPending}>
                  {(saveBulkCouponMutation.isPending || saveBulkEditMutation.isPending) ? "Processing..." : isBulkEditMode ? "Update Coupons" : "Create Bulk Coupons"}
                </Button>
              </div>
            </form>
          ) : (
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
                {form.formState.errors.code && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Discount</Label>
                <div className="flex gap-2">
                  <Input
                    id="discountAmount"
                    type="number"
                    {...form.register("discountAmount", { valueAsNumber: true })}
                    placeholder="100"
                    className="flex-1"
                  />
                  <Select
                    value={form.watch("discountType")}
                    onValueChange={(value) =>
                      form.setValue("discountType", value as "fixed" | "percentage")
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">₹ Fixed</SelectItem>
                      <SelectItem value="percentage">% Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.formState.errors.discountAmount && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.discountAmount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Total Uses (leave empty for unlimited)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  {...form.register("maxUses", {
                    valueAsNumber: true,
                    setValueAs: (value) => (value === "" ? null : Number(value)),
                  })}
                  placeholder="100"
                />
                {form.formState.errors.maxUses && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.maxUses.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
                <Input
                  id="maxUsesPerUser"
                  type="number"
                  {...form.register("maxUsesPerUser", { valueAsNumber: true })}
                  placeholder="1"
                />
                {form.formState.errors.maxUsesPerUser && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.maxUsesPerUser.message}
                  </p>
                )}
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
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="cohortOnly"
                  checked={form.watch("cohortOnly")}
                  onCheckedChange={(checked) => form.setValue("cohortOnly", checked)}
                />
                <Label htmlFor="cohortOnly">Cohort Only</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveCouponMutation.isPending}>
                  {editingCoupon ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminTabLayout>
  );
}