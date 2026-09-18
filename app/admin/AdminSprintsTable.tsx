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
  HelpCircle,
  Video,
  Play,
  X,
  Users,
  UploadCloud,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
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
import { uploadFileViaSignedUrl } from "@/lib/storage/client";
import SprintMentorManager from "./SprintMentorManager";
import SprintSessionManager from "./SprintSessionManager";
import SprintUpgradePlansManager from "./SprintUpgradePlansManager";
import SprintFaqManager from "./SprintFaqManager";
import ManageUserSprintPackagesModal from "./ManageUserSprintPackagesModal";
import { getVideoEmbedInfo } from "@/lib/video-embed";

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
  faqsHeading?: string;
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

type EditTab = "details" | "headings" | "audience" | "features" | "managers";

export default function AdminSprintsTable() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [orders, setOrders] = useState<SprintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sprints" | "orders">("sprints");
  const [toolkits, setToolkits] = useState<any[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<EditTab>("details");
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Managers modal states
  const [sessionManagerSprint, setSessionManagerSprint] = useState<{ id: string; title: string } | null>(null);
  const [upgradePlansSprint, setUpgradePlansSprint] = useState<{ id: string; title: string } | null>(null);
  const [faqManagerSprint, setFaqManagerSprint] = useState<{ id: string; title: string } | null>(null);
  const [mentorManagerSprint, setMentorManagerSprint] = useState<{ id: string; title: string } | null>(null);
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
    highlights: [] as string[],
    mentorsHeading: "Meet Your Mentors",
    mentorsLinkTarget: "",
    mentorsLimit: 2,
    featuresHeading: "What You Get",
    sessionsHeading: "Sprint Sessions & Curriculum",
    testimonialsHeading: "What Members Say About Our Ecosystem",
    faqsHeading: "Frequently Asked Questions",
    whoIsThisForHeading: "Who Is This For?",
    whoIsThisForBullets: [] as string[],
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
    features: [] as Feature[],
  });

  useEffect(() => {
    fetchSprints();
    fetchOrders();
    fetchToolkits();
  }, []);

  const fetchToolkits = async () => {
    try {
      const res = await axios.get("/api/toolkits");
      setToolkits(res.data || []);
    } catch (err) {
      console.error("Failed to load toolkits:", err);
    }
  };

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
    setActiveEditTab("details");
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
      highlights: [],
      mentorsHeading: "Meet Your Mentors",
      mentorsLinkTarget: "",
      mentorsLimit: 2,
      featuresHeading: "What You Get",
      sessionsHeading: "Sprint Sessions & Curriculum",
      testimonialsHeading: "What Members Say About Our Ecosystem",
      faqsHeading: "Frequently Asked Questions",
      whoIsThisForHeading: "Who Is This For?",
      whoIsThisForBullets: [],
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
      features: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (sprint: Sprint) => {
    try {
      const res = await axios.get(`/api/admin/sprints/${sprint.id}`);
      const full = res.data;
      setEditingSprint(full);
      setActiveEditTab("details");
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
        highlights: full.highlights || [],
        mentorsHeading: full.mentorsHeading || "Meet Your Mentors",
        mentorsLinkTarget: full.mentorsLinkTarget || "",
        mentorsLimit: full.mentorsLimit || 2,
        featuresHeading: full.featuresHeading || "What You Get",
        sessionsHeading: full.sessionsHeading || "Sprint Sessions & Curriculum",
        testimonialsHeading: full.testimonialsHeading || "What Members Say About Our Ecosystem",
        faqsHeading: full.faqsHeading || "Frequently Asked Questions",
        whoIsThisForHeading: full.whoIsThisForHeading || "Who Is This For?",
        whoIsThisForBullets: full.whoIsThisForBullets || [],
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
        features: full.features || [],
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error loading sprint for edit:", err);
      toast.error("Failed to load sprint details");
    }
  };

  const handleImageUpload = async (file: File, onUploaded: (url: string) => void) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }
    try {
      setIsUploadingImage(true);
      const uploaded = await uploadFileViaSignedUrl({
        domain: "opportunity-images",
        file,
      });
      onUploaded(uploaded.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveSprint = async () => {
    if (!formData.title || !formData.slug || formData.basePrice < 0) {
      toast.error("Please fill in all required fields (title, slug, base price)");
      return;
    }

    const payload = {
      ...formData,
      highlights: formData.highlights.map((s) => s.trim()).filter(Boolean),
      whoIsThisForBullets: formData.whoIsThisForBullets.map((s) => s.trim()).filter(Boolean),
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
      const res = await axios.put(`/api/admin/sprints/orders/${orderId}/verify`);
      toast.success(res.data.isVerified ? "Order verified" : "Order unverified");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sprint Programs Management</h2>
          <p className="text-xs text-zinc-400">
            Manage sprints, curriculum sessions, mentors, upgrade plans, FAQs, and participant orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveTab("sprints")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "sprints"
                  ? "bg-[#ff5e14] text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sprints ({sprints.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "orders"
                  ? "bg-[#ff5e14] text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Registrations & Orders ({orders.length})
            </button>
          </div>
          {activeTab === "sprints" && (
            <Button
              onClick={handleOpenCreate}
              className="bg-[#ff5e14] hover:bg-[#e04f0b] text-white text-xs gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Create Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "sprints" ? (
        loading ? (
          <div className="py-20 text-center text-zinc-400">Loading sprints...</div>
        ) : sprints.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No sprint programs created yet. Click &quot;Create Sprint&quot; to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sprints.map((sprint) => (
              <div
                key={sprint.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                        sprint.isActive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                      }`}
                    >
                      {sprint.isActive ? "Active" : "Draft"}
                    </span>
                    {sprint.startDate && (
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {sprint.startDate}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-white leading-tight">
                    {sprint.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {sprint.subtitle || "No description provided."}
                  </p>

                  <div className="text-xs font-mono text-emerald-400 pt-1">
                    Base: ₹{sprint.basePrice.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setMentorManagerSprint({ id: sprint.id, title: sprint.title })
                      }
                      className="border-zinc-700 text-blue-400 hover:text-blue-300 text-[11px] px-1.5 gap-1"
                    >
                      <Users className="w-3.5 h-3.5" /> Mentors
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSessionManagerSprint({ id: sprint.id, title: sprint.title })
                      }
                      className="border-zinc-700 text-zinc-300 text-[11px] px-1.5 gap-1"
                    >
                      <FolderCog className="w-3.5 h-3.5" /> Curriculum
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setUpgradePlansSprint({ id: sprint.id, title: sprint.title })
                      }
                      className="border-zinc-700 text-amber-400 hover:text-amber-300 text-[11px] px-1.5 gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" /> Packages
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFaqManagerSprint({ id: sprint.id, title: sprint.title })
                      }
                      className="border-zinc-700 text-cyan-400 hover:text-cyan-300 text-[11px] px-1.5 gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> FAQs
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(sprint)}
                      className="text-zinc-300 hover:text-white text-xs gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Full Dashboard
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

      {/* Unified Sprint Management Dashboard Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6 border-b border-zinc-800 pb-3">
              <div>
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ff5e14]" />
                  {editingSprint ? `Sprint Dashboard: ${editingSprint.title}` : "Create New Sprint"}
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure details, headings, target audience, features, and linked managers.
                </p>
              </div>

              {editingSprint && (
                <a
                  href={`/toolkit/sprints/${editingSprint.slug || editingSprint.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#ff5e14] hover:underline flex items-center gap-1 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Public Page
                </a>
              )}
            </div>
          </DialogHeader>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-zinc-800 my-3 overflow-x-auto pb-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveEditTab("details")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeEditTab === "details"
                  ? "bg-[#ff5e14] text-white shadow"
                  : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Page Details & Hero
            </button>
            <button
              type="button"
              onClick={() => setActiveEditTab("headings")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeEditTab === "headings"
                  ? "bg-[#ff5e14] text-white shadow"
                  : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Section Headings
            </button>
            <button
              type="button"
              onClick={() => setActiveEditTab("audience")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeEditTab === "audience"
                  ? "bg-[#ff5e14] text-white shadow"
                  : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Who Is This For? ({formData.whoIsThisForBullets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveEditTab("features")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeEditTab === "features"
                  ? "bg-[#ff5e14] text-white shadow"
                  : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              What You Get ({formData.features.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveEditTab("managers")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeEditTab === "managers"
                  ? "bg-[#ff5e14] text-white shadow"
                  : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Linked Managers
            </button>
          </div>

          {/* Tab 1: Page Details & Hero */}
          {activeEditTab === "details" && (
            <div className="space-y-5 py-2 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-zinc-400">Sprint Title *</Label>
                  <Input
                    placeholder="e.g. 10-Day UI/UX Growth Sprint"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">URL Slug *</Label>
                  <Input
                    placeholder="e.g. uiux-growth-sprint"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-zinc-400">Base Price (₹) *</Label>
                  <Input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="bg-zinc-950 border-zinc-800 mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Original Price (Strikethrough ₹)</Label>
                  <Input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="Optional"
                    className="bg-zinc-950 border-zinc-800 mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Start Date / Timeline</Label>
                  <Input
                    placeholder="e.g. Starts 20th Oct • 2 Weeks"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-zinc-400">Sprint Subtitle / Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Brief overview of sprint goals and outcomes..."
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-zinc-400">Badge 1</Label>
                  <Input
                    placeholder="e.g. Live Cohort"
                    value={formData.badge1}
                    onChange={(e) => setFormData({ ...formData, badge1: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Badge 2</Label>
                  <Input
                    placeholder="e.g. Limited Seats"
                    value={formData.badge2}
                    onChange={(e) => setFormData({ ...formData, badge2: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Linked Content Toolkit</Label>
                  <select
                    value={formData.toolkitId}
                    onChange={(e) => setFormData({ ...formData, toolkitId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 mt-1"
                  >
                    <option value="">-- None (Standalone sprint) --</option>
                    {toolkits.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.category || "General"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Top Banner Video Configuration with Live Preview */}
              <div className="space-y-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/70">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 font-bold text-zinc-200 text-xs uppercase tracking-wider">
                    <Video className="w-4 h-4 text-[#ff5e14]" />
                    Top Banner Video (Priority over Image)
                  </Label>
                  {formData.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, videoUrl: "" })}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear Video
                    </button>
                  )}
                </div>

                <Input
                  placeholder="Paste YouTube link, Instagram Reel URL, or Bunny CDN stream URL..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-sm"
                />

                <p className="text-[11px] text-zinc-400">
                  Supported: YouTube videos/shorts, Instagram Reels/posts, Bunny CDN streams (<code className="text-zinc-300">iframe.mediadelivery.net/...</code>), or direct video files (.mp4).
                </p>

                {/* Live Preview */}
                {(() => {
                  const embed = formData.videoUrl ? getVideoEmbedInfo(formData.videoUrl) : null;
                  if (!formData.videoUrl.trim()) return null;

                  if (!embed) {
                    return (
                      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>URL entered is not recognized as a supported YouTube, Instagram, or Bunny CDN link.</span>
                      </div>
                    );
                  }

                  const providerLabel = {
                    youtube: "YouTube Video",
                    instagram: "Instagram Reel",
                    bunny: "Bunny CDN Stream",
                    direct: "Direct Video",
                  }[embed.provider];

                  return (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Play className="w-3 h-3" /> Detected: {providerLabel}
                        </span>
                      </div>

                      <div className={`relative w-full ${embed.provider === "instagram" ? "h-80 sm:h-96" : "aspect-video"} rounded-lg overflow-hidden border border-zinc-800 bg-black shadow-lg`}>
                        {embed.provider === "youtube" || embed.provider === "bunny" ? (
                          <iframe
                            src={embed.embedUrl}
                            title="Banner Video Preview"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                            allowFullScreen
                          />
                        ) : embed.provider === "instagram" ? (
                          <div className="w-full h-full flex items-center justify-center p-2 bg-zinc-950">
                            <iframe
                              src={embed.embedUrl}
                              title="Instagram Preview"
                              className="w-full max-w-xs h-full rounded-lg border-0 bg-white"
                              allow="encrypted-media; fullscreen"
                              allowFullScreen
                              scrolling="no"
                            />
                          </div>
                        ) : (
                          <video
                            src={embed.embedUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Hero Banner Images (Fallback Carousel) */}
              <div className="space-y-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/70">
                <Label className="flex items-center gap-1.5 font-bold text-zinc-200 text-xs uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  Hero Banner Images (Fallback when no video is set)
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((slotIdx) => {
                    const currentImg = formData.coverImageUrls[slotIdx] || (slotIdx === 0 ? formData.coverImageUrl : "");
                    return (
                      <div key={slotIdx} className="p-3 border border-zinc-800 rounded-xl bg-zinc-900/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-300">
                            {slotIdx === 0 ? "1. Primary Cover" : `Slot ${slotIdx + 1} (Carousel)`}
                          </span>
                          {currentImg && (
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = [...formData.coverImageUrls];
                                newUrls.splice(slotIdx, 1);
                                setFormData({
                                  ...formData,
                                  coverImageUrl: slotIdx === 0 ? newUrls[0] || "" : formData.coverImageUrl,
                                  coverImageUrls: newUrls,
                                });
                              }}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {currentImg ? (
                          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-zinc-800 bg-black">
                            <img src={currentImg} alt={`Banner ${slotIdx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <label className="border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer bg-zinc-950/40 transition">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(file, (url) => {
                                    const newUrls = [...formData.coverImageUrls];
                                    newUrls[slotIdx] = url;
                                    setFormData({
                                      ...formData,
                                      coverImageUrl: slotIdx === 0 ? url : formData.coverImageUrl,
                                      coverImageUrls: newUrls,
                                    });
                                  });
                                }
                              }}
                            />
                            <UploadCloud className="w-5 h-5 text-zinc-500 mb-1" />
                            <span className="text-[11px] text-zinc-400 font-medium">Upload Image</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Switches & Settings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-zinc-800 rounded-xl bg-zinc-950/60">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">Active Status</Label>
                  <div className="pt-1">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">Best Seller Badge</Label>
                  <div className="pt-1">
                    <Switch
                      checked={formData.isBestSeller}
                      onCheckedChange={(val) => setFormData({ ...formData, isBestSeller: val })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">Filling Fast Badge</Label>
                  <div className="pt-1">
                    <Switch
                      checked={formData.isFillingFast}
                      onCheckedChange={(val) => setFormData({ ...formData, isFillingFast: val })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">Early Bird Offer</Label>
                  <div className="pt-1">
                    <Switch
                      checked={formData.hasEarlyBird}
                      onCheckedChange={(val) => setFormData({ ...formData, hasEarlyBird: val })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Section Headings */}
          {activeEditTab === "headings" && (
            <div className="space-y-4 py-2 flex-1">
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-400 mb-4">
                  Customize the heading titles for each section on the Sprint Detail page.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-300">Mentors Section Heading</Label>
                    <Input
                      placeholder="e.g. Meet Your Mentors"
                      value={formData.mentorsHeading}
                      onChange={(e) => setFormData({ ...formData, mentorsHeading: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-300">Sessions & Curriculum Heading</Label>
                    <Input
                      placeholder="e.g. Sprint Sessions & Curriculum"
                      value={formData.sessionsHeading}
                      onChange={(e) => setFormData({ ...formData, sessionsHeading: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-300">What You Get / Features Heading</Label>
                    <Input
                      placeholder="e.g. What You Get"
                      value={formData.featuresHeading}
                      onChange={(e) => setFormData({ ...formData, featuresHeading: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-300">Who Is This For? Heading</Label>
                    <Input
                      placeholder="e.g. Who Is This For?"
                      value={formData.whoIsThisForHeading}
                      onChange={(e) => setFormData({ ...formData, whoIsThisForHeading: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-300">Testimonials / Community Buzz Heading</Label>
                    <Input
                      placeholder="e.g. What Members Say About Our Ecosystem"
                      value={formData.testimonialsHeading}
                      onChange={(e) => setFormData({ ...formData, testimonialsHeading: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-300">FAQs Section Heading</Label>
                    <Input
                      placeholder="e.g. Frequently Asked Questions"
                      value={formData.faqsHeading}
                      onChange={(e) => setFormData({ ...formData, faqsHeading: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-sm mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs text-zinc-300">Investment Summary Label</Label>
                    <Input
                      placeholder="e.g. Total Investment"
                      value={formData.investmentLabel}
                      onChange={(e) => setFormData({ ...formData, investmentLabel: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-sm mt-1 max-w-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Who Is This For? & Highlights */}
          {activeEditTab === "audience" && (
            <div className="space-y-5 py-2 flex-1">
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Who Is This For? - Target Audience Points</h4>
                    <p className="text-xs text-zinc-400">
                      Renders as numbered circular pills (1, 2, 3...) on the Sprint Detail page.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        whoIsThisForBullets: [...formData.whoIsThisForBullets, ""],
                      });
                    }}
                    className="bg-[#ff5e14] hover:bg-[#e04f0b] text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Point
                  </Button>
                </div>

                {formData.whoIsThisForBullets.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center border border-dashed border-zinc-800 rounded-lg">
                    No target audience points added yet. Click &quot;Add Point&quot; above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.whoIsThisForBullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-[#ff5e14] font-bold text-xs flex items-center justify-center shrink-0 border border-orange-500/30">
                          {idx + 1}
                        </span>
                        <Input
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...formData.whoIsThisForBullets];
                            newBullets[idx] = e.target.value;
                            setFormData({ ...formData, whoIsThisForBullets: newBullets });
                          }}
                          placeholder={`Point #${idx + 1}: e.g. Designers wanting to transition to Product Management`}
                          className="bg-zinc-900 border-zinc-800 text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newBullets = formData.whoIsThisForBullets.filter((_, i) => i !== idx);
                            setFormData({ ...formData, whoIsThisForBullets: newBullets });
                          }}
                          className="p-2 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Highlights */}
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Catalog Card Highlights</h4>
                    <p className="text-xs text-zinc-400">
                      Short bullet points shown on the sprint card in /toolkit.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        highlights: [...formData.highlights, ""],
                      });
                    }}
                    className="border-zinc-700 text-zinc-300 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Highlight
                  </Button>
                </div>

                {formData.highlights.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center border border-dashed border-zinc-800 rounded-lg">
                    No highlights added yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={h}
                          onChange={(e) => {
                            const newHighlights = [...formData.highlights];
                            newHighlights[idx] = e.target.value;
                            setFormData({ ...formData, highlights: newHighlights });
                          }}
                          placeholder={`Highlight #${idx + 1}: e.g. 5 Hands-on Projects`}
                          className="bg-zinc-900 border-zinc-800 text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newHighlights = formData.highlights.filter((_, i) => i !== idx);
                            setFormData({ ...formData, highlights: newHighlights });
                          }}
                          className="p-2 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: What You Get (Features) */}
          {activeEditTab === "features" && (
            <div className="space-y-4 py-2 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Features List</h4>
                  <p className="text-xs text-zinc-400">
                    Displays in the &quot;What You Get&quot; section on the detail page.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      features: [
                        ...formData.features,
                        { icon: "Check", title: "", description: "" },
                      ],
                    });
                  }}
                  className="bg-[#ff5e14] hover:bg-[#e04f0b] text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Feature Card
                </Button>
              </div>

              {formData.features.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl space-y-2">
                  <CheckCircle className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-medium">No feature cards added yet</p>
                  <p className="text-xs text-zinc-500">
                    Click &quot;Add Feature Card&quot; to describe program deliverables.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#ff5e14] uppercase tracking-wider">
                          Feature #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = formData.features.filter((_, i) => i !== idx);
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-zinc-400">Feature Title *</Label>
                          <Input
                            placeholder="e.g. 1-on-1 Portfolio Reviews"
                            value={feat.title}
                            onChange={(e) => {
                              const newFeatures = [...formData.features];
                              newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                              setFormData({ ...formData, features: newFeatures });
                            }}
                            className="bg-zinc-900 border-zinc-800 text-sm mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Icon</Label>
                          <select
                            value={feat.icon || "Check"}
                            onChange={(e) => {
                              const newFeatures = [...formData.features];
                              newFeatures[idx] = { ...newFeatures[idx], icon: e.target.value };
                              setFormData({ ...formData, features: newFeatures });
                            }}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 mt-1"
                          >
                            <option value="Check">Checkmark</option>
                            <option value="Video">Video</option>
                            <option value="FileText">Document</option>
                            <option value="Users">Community / Mentorship</option>
                            <option value="Zap">Zap / Fast Track</option>
                            <option value="Award">Certification / Trophy</option>
                            <option value="Sparkles">Sparkles</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-zinc-400">Feature Description</Label>
                        <Input
                          placeholder="e.g. Direct feedback and teardown from lead designers to polish your case studies."
                          value={feat.description}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[idx] = { ...newFeatures[idx], description: e.target.value };
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          className="bg-zinc-900 border-zinc-800 text-sm mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Linked Managers */}
          {activeEditTab === "managers" && (
            <div className="space-y-4 py-2 flex-1">
              <p className="text-xs text-zinc-400">
                Launch specialized managers for mentors, curriculum sessions, upgrade packages, and FAQs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mentors Card */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                      <Users className="w-4 h-4" />
                      Sprint Mentors (Max 2)
                    </div>
                    <p className="text-xs text-zinc-400">
                      Add up to 2 mentors with direct photo uploads and LinkedIn profiles. Renders with opposing tilt effect.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (editingSprint) {
                        setMentorManagerSprint({ id: editingSprint.id, title: editingSprint.title });
                      } else {
                        toast.info("Save sprint first to manage mentors");
                      }
                    }}
                    className="border-zinc-700 text-blue-300 hover:text-white text-xs w-full"
                  >
                    Open Mentors Manager
                  </Button>
                </div>

                {/* Curriculum Sessions Card */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm">
                      <FolderCog className="w-4 h-4 text-[#ff5e14]" />
                      Curriculum & Sessions
                    </div>
                    <p className="text-xs text-zinc-400">
                      Manage live session dates, descriptions, Bunny CDN recordings, and resources.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (editingSprint) {
                        setSessionManagerSprint({ id: editingSprint.id, title: editingSprint.title });
                      } else {
                        toast.info("Save sprint first to manage curriculum");
                      }
                    }}
                    className="border-zinc-700 text-zinc-200 hover:text-white text-xs w-full"
                  >
                    Open Curriculum Manager
                  </Button>
                </div>

                {/* Upgrade Packages Card */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Layers className="w-4 h-4" />
                      Upgrade Plans & Tiers
                    </div>
                    <p className="text-xs text-zinc-400">
                      Configure custom bundle tiers, upsell add-ons, and targeted user upgrade packages.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (editingSprint) {
                        setUpgradePlansSprint({ id: editingSprint.id, title: editingSprint.title });
                      } else {
                        toast.info("Save sprint first to manage upgrade packages");
                      }
                    }}
                    className="border-zinc-700 text-amber-300 hover:text-white text-xs w-full"
                  >
                    Open Packages Manager
                  </Button>
                </div>

                {/* FAQs Card */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <HelpCircle className="w-4 h-4" />
                      FAQs Manager
                    </div>
                    <p className="text-xs text-zinc-400">
                      Create accordion questions, rich text answers, and separately attached image banners.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (editingSprint) {
                        setFaqManagerSprint({ id: editingSprint.id, title: editingSprint.title });
                      } else {
                        toast.info("Save sprint first to manage FAQs");
                      }
                    }}
                    className="border-zinc-700 text-cyan-300 hover:text-white text-xs w-full"
                  >
                    Open FAQs Manager
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-zinc-800 pt-3 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveSprint}
              disabled={isUploadingImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              {editingSprint ? "Save All Changes" : "Create Sprint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embedded Manager Modals */}
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

      {faqManagerSprint && (
        <SprintFaqManager
          open={Boolean(faqManagerSprint)}
          onClose={() => setFaqManagerSprint(null)}
          sprintId={faqManagerSprint.id}
          sprintTitle={faqManagerSprint.title}
          onUpdate={fetchSprints}
        />
      )}

      {mentorManagerSprint && (
        <SprintMentorManager
          open={Boolean(mentorManagerSprint)}
          onClose={() => setMentorManagerSprint(null)}
          sprintId={mentorManagerSprint.id}
          sprintTitle={mentorManagerSprint.title}
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
