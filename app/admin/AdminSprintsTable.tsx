/* eslint-disable max-lines */
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Edit,
  Trash2,
  Plus,
  FolderCog,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SprintSessionManager from "./SprintSessionManager";
import SprintUpgradePlansManager from "./SprintUpgradePlansManager";
import ManageUserSprintPackagesModal from "./ManageUserSprintPackagesModal";

interface Mentor {
  id?: string;
  name: string;
  role: string;
  imageUrl: string;
  bio?: string;
  link?: string;
}

interface Feature {
  id?: string;
  icon: string;
  title: string;
  description: string;
}

interface Tier {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  description: string;
  whatIncluded: string[] | string;
  isDefault: boolean;
}

interface Addon {
  id?: string;
  name: string;
  priceDelta: number;
  description: string;
}

interface Session {
  id?: string;
  title: string;
  description: string;
  price?: number;
  originalPrice?: number | null;
  showInDashboard?: boolean;
  showInHome?: boolean;
}

interface Sprint {
  id: string;
  title: string;
  slug: string;
  badge1?: string;
  badge2?: string;
  subtitle?: string;
  coverImageUrl?: string;
  coverImageUrls?: string[];
  cardImageUrl?: string;
  startDate?: string;
  highlights?: string[];
  mentorsHeading?: string;
  mentorsLinkTarget?: string;
  mentorsLimit?: number;
  featuresHeading?: string;
  sessionsHeading?: string;
  testimonialsHeading?: string;
  whoIsThisForHeading?: string;
  whoIsThisForBullets?: string[];
  investmentLabel?: string;
  basePrice: number;
  originalPrice?: number | null;
  videoUrl?: string | null;
  toolkitId?: string;
  isActive: boolean;
  isBestSeller?: boolean;
  isFillingFast?: boolean;
  hasEarlyBird?: boolean;
  isVerificationRequired?: boolean;
  showEarlyBirdCheckout?: boolean;
  showEarlyBirdMarqueeCheckout?: boolean;
  showAddonsCheckout?: boolean;
  createdAt: string;
  updatedAt?: string;
  mentors?: Mentor[];
  features?: Feature[];
  tiers?: Tier[];
  addons?: Addon[];
  sessions?: Session[];
}

interface SprintOrder {
  id: string;
  sprintId: string;
  sprintTitle?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buddyEmail?: string;
  tierName?: string;
  selectedUpgradePlanId?: string;
  upgradePlanTitle?: string;
  amountPaid: number;
  status: string;
  isVerified?: boolean;
  createdAt: string;
  userId?: string;
}

export default function AdminSprintsTable() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [orders, setOrders] = useState<SprintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sprints" | "orders">("sprints");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [sessionManagerSprint, setSessionManagerSprint] = useState<{ id: string; title: string } | null>(null);
  const [upgradePlansSprint, setUpgradePlansSprint] = useState<{ id: string; title: string } | null>(null);
  const [packageTargetModal, setPackageTargetModal] = useState<{
    open: boolean;
    sprintId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userTierName?: string;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    badge1: "",
    badge2: "",
    subtitle: "",
    coverImageUrl: "",
    coverImageUrls: [] as string[],
    cardImageUrl: "",
    videoUrl: "",
    startDate: "",
    highlightsText: "",
    mentorsHeading: "Meet Your Mentors",
    mentorsLinkTarget: "",
    mentorsLimit: 4,
    featuresHeading: "What You Get",
    sessionsHeading: "Sprint Sessions & Curriculum",
    testimonialsHeading: "What Members Say About Our Ecosystem",
    whoIsThisForHeading: "Who Is This For?",
    whoIsThisForBulletsText: "",
    investmentLabel: "Total Investment",
    basePrice: 0,
    originalPrice: "" as string | number,
    toolkitId: "",
    isActive: true,
    isBestSeller: false,
    isFillingFast: false,
    hasEarlyBird: false,
    isVerificationRequired: true,
    showEarlyBirdCheckout: false,
    showEarlyBirdMarqueeCheckout: false,
    showAddonsCheckout: true,
  });



  useEffect(() => {
    fetchSprints();
    fetchOrders();
  }, []);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/sprints");
      setSprints(res.data || []);
    } catch (err) {
      console.error("Error fetching sprints:", err);
      toast.error("Failed to load sprints");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/admin/sprints/orders");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching sprint orders:", err);
    }
  };

  const handleOpenCreate = () => {
    setEditingSprint(null);
    setFormData({
      title: "",
      slug: "",
      badge1: "",
      badge2: "",
      subtitle: "",
      coverImageUrl: "",
      coverImageUrls: [],
      cardImageUrl: "",
      videoUrl: "",
      startDate: "",
      highlightsText: "",
      mentorsHeading: "Meet Your Mentors",
      mentorsLinkTarget: "",
      mentorsLimit: 4,
      featuresHeading: "What You Get",
      sessionsHeading: "Sprint Sessions & Curriculum",
      testimonialsHeading: "What Members Say About Our Ecosystem",
      whoIsThisForHeading: "Who Is This For?",
      whoIsThisForBulletsText: "",
      investmentLabel: "Total Investment",
      basePrice: 0,
      originalPrice: "",
      toolkitId: "",
      isActive: true,
      isBestSeller: false,
      isFillingFast: false,
      hasEarlyBird: false,
      isVerificationRequired: true,
      showEarlyBirdCheckout: false,
      showEarlyBirdMarqueeCheckout: false,
      showAddonsCheckout: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (sprint: Sprint) => {
    try {
      const res = await axios.get(`/api/admin/sprints/${sprint.id}`);
      const full = res.data;
      setEditingSprint(full);
      setFormData({
        title: full.title || "",
        slug: full.slug || "",
        badge1: full.badge1 || "",
        badge2: full.badge2 || "",
        subtitle: full.subtitle || "",
        coverImageUrl: full.coverImageUrl || "",
        coverImageUrls: full.coverImageUrls || [],
        cardImageUrl: full.cardImageUrl || "",
        videoUrl: full.videoUrl || "",
        startDate: full.startDate || "",
        highlightsText: (full.highlights || []).join("\n"),
        mentorsHeading: full.mentorsHeading || "Meet Your Mentors",
        mentorsLinkTarget: full.mentorsLinkTarget || "",
        mentorsLimit: full.mentorsLimit || 4,
        featuresHeading: full.featuresHeading || "What You Get",
        sessionsHeading: full.sessionsHeading || "Sprint Sessions & Curriculum",
        testimonialsHeading: full.testimonialsHeading || "What Members Say About Our Ecosystem",
        whoIsThisForHeading: full.whoIsThisForHeading || "Who Is This For?",
        whoIsThisForBulletsText: (full.whoIsThisForBullets || []).join("\n"),
        investmentLabel: full.investmentLabel || "Total Investment",
        basePrice: full.basePrice || 0,
        originalPrice: full.originalPrice || "",
        toolkitId: full.toolkitId || "",
        isActive: full.isActive !== undefined ? full.isActive : true,
        isBestSeller: full.isBestSeller || false,
        isFillingFast: full.isFillingFast || false,
        hasEarlyBird: full.hasEarlyBird || false,
        isVerificationRequired: full.isVerificationRequired !== undefined ? full.isVerificationRequired : true,
        showEarlyBirdCheckout: full.showEarlyBirdCheckout || false,
        showEarlyBirdMarqueeCheckout: full.showEarlyBirdMarqueeCheckout || false,
        showAddonsCheckout: full.showAddonsCheckout !== undefined ? full.showAddonsCheckout : true,
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error loading sprint for edit:", err);
      toast.error("Failed to load sprint details");
    }
  };

  const handleSaveSprint = async () => {
    if (!formData.title || !formData.slug || formData.basePrice < 0) {
      toast.error("Please fill in all required fields (title, slug, base price)");
      return;
    }

    const payload = {
      ...formData,
      highlights: formData.highlightsText.split("\n").map(s => s.trim()).filter(Boolean),
      whoIsThisForBullets: formData.whoIsThisForBulletsText.split("\n").map(s => s.trim()).filter(Boolean),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
    };

    try {
      if (editingSprint) {
        await axios.put(`/api/admin/sprints/${editingSprint.id}`, payload);
        toast.success("Sprint updated successfully");
      } else {
        await axios.post("/api/admin/sprints", payload);
        toast.success("Sprint created successfully");
      }
      setIsModalOpen(false);
      fetchSprints();
    } catch (err: any) {
      console.error("Error saving sprint:", err);
      toast.error(err.response?.data?.error || "Failed to save sprint");
    }
  };

  const handleDeleteSprint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sprint?")) return;
    try {
      await axios.delete(`/api/admin/sprints/${id}`);
      toast.success("Sprint deleted successfully");
      fetchSprints();
    } catch (err) {
      console.error("Error deleting sprint:", err);
      toast.error("Failed to delete sprint");
    }
  };

  const handleToggleVerifyOrder = async (orderId: string) => {
    try {
      const res = await axios.patch(`/api/admin/sprints/orders/${orderId}/verify`);
      toast.success(res.data.isVerified ? "Order verified" : "Order unverified");
      fetchOrders();
    } catch (err) {
      console.error("Error toggling order verification:", err);
      toast.error("Failed to update order status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b border-zinc-800 pb-2">
          <Button
            variant={activeTab === "sprints" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("sprints")}
            className={activeTab === "sprints" ? "bg-zinc-800 text-white" : "text-zinc-400"}
          >
            Sprints ({sprints.length})
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("orders")}
            className={activeTab === "orders" ? "bg-zinc-800 text-white" : "text-zinc-400"}
          >
            Orders ({orders.length})
          </Button>
        </div>

        {activeTab === "sprints" && (
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
          >
            <Plus className="w-4 h-4" /> Create Sprint
          </Button>
        )}
      </div>

      {activeTab === "sprints" ? (
        loading ? (
          <div className="py-12 text-center text-zinc-400">Loading sprints...</div>
        ) : sprints.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
            No sprints found. Create one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sprints.map((sprint) => (
              <div
                key={sprint.id}
                className="p-5 rounded-xl border bg-zinc-900/60 border-zinc-800 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        sprint.isActive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {sprint.isActive ? "Active" : "Draft"}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      /{sprint.slug}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{sprint.title}</h3>
                  {sprint.subtitle && (
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {sprint.subtitle}
                    </p>
                  )}

                  <div className="pt-2 text-sm font-semibold text-emerald-400">
                    Base: ₹{sprint.basePrice.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSessionManagerSprint({ id: sprint.id, title: sprint.title })
                      }
                      className="border-zinc-700 text-zinc-300 text-xs gap-1"
                    >
                      <FolderCog className="w-3.5 h-3.5" /> Curriculum
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setUpgradePlansSprint({ id: sprint.id, title: sprint.title })
                      }
                      className="border-zinc-700 text-amber-400 hover:text-amber-300 text-xs gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" /> Packages
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(sprint)}
                      className="text-zinc-300 hover:text-white text-xs gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Settings
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSprint(sprint.id)}
                      className="text-red-400 hover:text-red-300 text-xs gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-3">Buyer Name</th>
                <th className="p-3">Email / Phone</th>
                <th className="p-3">Sprint</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-800/40">
                    <td className="p-3 font-semibold text-white">{o.buyerName}</td>
                    <td className="p-3 text-xs">
                      <div>{o.buyerEmail}</div>
                      {o.buyerPhone && <div className="text-zinc-500">{o.buyerPhone}</div>}
                    </td>
                    <td className="p-3 text-xs font-medium text-amber-400">
                      {o.sprintTitle || "Sprint"}
                    </td>
                    <td className="p-3 font-mono text-emerald-400">
                      ₹{Math.round(o.amountPaid / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          o.isVerified
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {o.isVerified ? "Verified" : "Pending Verification"}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleVerifyOrder(o.id)}
                        className="text-xs border-zinc-700"
                      >
                        {o.isVerified ? "Unverify" : "Verify Order"}
                      </Button>

                      {o.userId && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setPackageTargetModal({
                              open: true,
                              sprintId: o.sprintId,
                              userId: o.userId!,
                              userName: o.buyerName,
                              userEmail: o.buyerEmail,
                              userTierName: o.tierName,
                            })
                          }
                          className="text-xs"
                        >
                          Target Packages
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sprint Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSprint ? "Edit Sprint" : "Create Sprint"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              <div>
                <Label>Original Strikethrough Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
            </div>

            <div>
              <Label>Subtitle</Label>
              <Textarea
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>

            <div>
              <Label>Banner Video URL (YouTube or Instagram Reel/Post)</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Supports YouTube videos/shorts and Instagram Reels/posts. Displays in the inner banner.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label>Active Status</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSprint} className="bg-emerald-600 hover:bg-emerald-700">
              Save Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sessionManagerSprint && (
        <SprintSessionManager
          open={Boolean(sessionManagerSprint)}
          onClose={() => setSessionManagerSprint(null)}
          sprintId={sessionManagerSprint.id}
          sprintTitle={sessionManagerSprint.title}
          onUpdate={fetchSprints}
        />
      )}

      {upgradePlansSprint && (
        <SprintUpgradePlansManager
          open={Boolean(upgradePlansSprint)}
          onClose={() => setUpgradePlansSprint(null)}
          sprintId={upgradePlansSprint.id}
          sprintTitle={upgradePlansSprint.title}
          onUpdate={fetchSprints}
        />
      )}

      {packageTargetModal && (
        <ManageUserSprintPackagesModal
          open={packageTargetModal.open}
          onClose={() => setPackageTargetModal(null)}
          sprintId={packageTargetModal.sprintId}
          userId={packageTargetModal.userId}
          userName={packageTargetModal.userName}
          userEmail={packageTargetModal.userEmail}
          userTierName={packageTargetModal.userTierName}
        />
      )}
    </div>
  );
}
