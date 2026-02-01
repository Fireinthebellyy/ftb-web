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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Edit, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type Coupon = {
  id: string;
  code: string;
  discountAmount: number;
  maxUses: number | null;
  maxUsesPerUser: number;
  currentUses: number;
  isActive: boolean;
  expiresAt: Date | string | null;
  createdAt: Date | string;
};

const couponFormSchema = z.object({
  code: z.string().min(1).max(50),
  discountAmount: z.number().int().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional(),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

export default function AdminCouponsTable() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

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

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{ coupons: Coupon[] }>(
        "/api/admin/coupons"
      );
      setCoupons(response.data.coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    const expiresAtValue = coupon.expiresAt
      ? new Date(coupon.expiresAt).toISOString().slice(0, 16)
      : "";
    form.reset({
      code: coupon.code,
      discountAmount: coupon.discountAmount,
      maxUses: coupon.maxUses ?? null,
      maxUsesPerUser: coupon.maxUsesPerUser,
      isActive: coupon.isActive,
      expiresAt: expiresAtValue || undefined,
    });
    setDialogOpen(true);
  };

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

  const handleSubmit = async (data: CouponFormValues) => {
    try {
      // Convert datetime-local format to ISO string if provided
      const submitData = {
        ...data,
        expiresAt: data.expiresAt && data.expiresAt.trim()
          ? new Date(data.expiresAt).toISOString()
          : null,
      };

      if (editingCoupon) {
        await axios.patch(`/api/admin/coupons/${editingCoupon.id}`, submitData);
        toast.success("Coupon updated successfully");
      } else {
        await axios.post("/api/admin/coupons", submitData);
        toast.success("Coupon created successfully");
      }
      setDialogOpen(false);
      fetchCoupons();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to save coupon");
      } else {
        toast.error("Failed to save coupon");
      }
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/coupons/${couponId}`);
      toast.success("Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to delete coupon");
      } else {
        toast.error("Failed to delete coupon");
      }
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading coupons...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Per User Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No coupons found
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-semibold">
                    {coupon.code}
                  </TableCell>
                  <TableCell>₹{coupon.discountAmount}</TableCell>
                  <TableCell>
                    {coupon.maxUses !== null
                      ? `${coupon.currentUses} / ${coupon.maxUses}`
                      : `${coupon.currentUses} / ∞`}
                  </TableCell>
                  <TableCell>{coupon.maxUsesPerUser}</TableCell>
                  <TableCell>
                    <Badge
                      variant={coupon.isActive ? "default" : "secondary"}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="SAVE100"
                className="uppercase"
                onChange={(e) =>
                  form.setValue("code", e.target.value.toUpperCase())
                }
              />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount Amount (₹)</Label>
              <Input
                id="discountAmount"
                type="number"
                {...form.register("discountAmount", { valueAsNumber: true })}
                placeholder="100"
              />
              {form.formState.errors.discountAmount && (
                <p className="text-sm text-destructive">
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
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
                placeholder="100"
              />
              {form.formState.errors.maxUses && (
                <p className="text-sm text-destructive">
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
                <p className="text-sm text-destructive">
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
              {form.formState.errors.expiresAt && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.expiresAt.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
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
              <Button type="submit">
                {editingCoupon ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
