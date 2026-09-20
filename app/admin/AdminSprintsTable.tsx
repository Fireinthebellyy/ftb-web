/* eslint-disable max-lines */
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Edit,
  Trash2,
  Plus,
  Loader2,
  X,
  ArrowUp,
  ArrowDown,
  Download,
  FolderCog,
  Gift,
  Layers,
  Users,
  HelpCircle,
  Video,
  Play,
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

interface Faq {
  id?: string;
  question: string;
  answer: string;
}

interface Sprint {
  id: string;
  title: string;
  slug: string;
  badge1?: string;
  badge2?: string;
  subtitle?: string;
  coverImageUrl?: string;
  coverImageUrls?: string[] | null;
  cardImageUrl?: string | null;
  videoUrl?: string | null;
  startDate?: string | null;
  highlights?: string[] | null;
  mentorsHeading?: string;
  mentorsLinkTarget?: string;
  mentorsLimit?: number;
  featuresHeading?: string;
  sessionsHeading?: string | null;
  testimonialsHeading?: string | null;
  faqsHeading?: string | null;
  whoIsThisForHeading?: string | null;
  whoIsThisForBullets?: string[] | null;
  investmentLabel?: string;
  basePrice: number;
  originalPrice?: number | null;
  toolkitId?: string | null;
  isActive: boolean;
  isBestSeller?: boolean | null;
  isFillingFast?: boolean | null;
  hasEarlyBird?: boolean | null;
  isVerificationRequired: boolean;
  showEarlyBirdCheckout?: boolean | null;
  showEarlyBirdMarqueeCheckout?: boolean | null;
  showAddonsCheckout?: boolean | null;
  mentors?: Mentor[];
  features?: Feature[];
  tiers?: Tier[];
  addons?: Addon[];
  sessions?: Session[];
  faqs?: Faq[];
}

interface Order {
  id: string;
  userId?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  buddyEmail?: string | null;
  amountPaid: number;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: string;
  createdAt: string;
  sprintTitle: string | null;
  sprintId: string | null;
  tierName: string | null;
  isVerified: boolean;
  registrationName: string | null;
  registrationCollege: string | null;
  registrationCourse: string | null;
  registrationYear: string | null;
  registrationExpectations: string | null;
  registrationCompletedAt: string | null;
  selectedSessionIds: string[] | null;
  selectedAddOnIds: string[] | null;
  selectedUpgradePlanId?: string | null;
  upgradePlanTitle?: string | null;
  upgradePlanPrice?: number | null;
  upgradePlanSectionLabel?: string | null;
  upgradePlanIsAllInOne?: boolean | null;
  couponId: string | null;
  couponCode: string | null;
}

export default function AdminSprintsTable() {
  const [view, setView] = useState<"sprints" | "orders" | "registrations">("sprints");
  const [sprintsList, setSprintsList] = useState<Sprint[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "paid" | "created" | "failed">("all");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [registrationSearchTerm, setRegistrationSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sprint creation state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSprintTitle, setNewSprintTitle] = useState("");
  const [newSprintSlug, setNewSprintSlug] = useState("");
  const [newSprintPrice, setNewSprintPrice] = useState(4999);

  // Sprint editing state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<
    "details" | "mentors" | "features" | "pricing" | "curriculum" | "faqs"
  >("details");

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [toolkits, setToolkits] = useState<any[]>([]);

  // Managers modal states
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
  const [upgradePlansOpen, setUpgradePlansOpen] = useState(false);
  const [mentorManagerOpen, setMentorManagerOpen] = useState(false);
  const [faqManagerOpen, setFaqManagerOpen] = useState(false);
  const [managingSprint, setManagingSprint] = useState<Sprint | null>(null);

  // User package targeting modal state
  const [managePackagesModalState, setManagePackagesModalState] = useState<{
    open: boolean;
    sprintId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userTierName?: string;
    isBundleUser?: boolean;
  }>({
    open: false,
    sprintId: "",
    userId: "",
    userName: "",
    userEmail: "",
  });

  // Sessions data for registration details
  const [sessionsData, setSessionsData] = useState<Record<string, any[]>>({});

  // Load Initial Data
  useEffect(() => {
    fetchSprints();
    fetchToolkits();
  }, []);

  useEffect(() => {
    if (sprintsList.length > 0) {
      fetchOrders();
    }
  }, [sprintsList]);

  const fetchToolkits = async () => {
    try {
      const response = await axios.get("/api/admin/toolkits");
      setToolkits(response.data);
    } catch (err) {
      console.error("Failed to load toolkits list:", err);
    }
  };

  const fetchSprints = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/sprints");
      setSprintsList(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sprints");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/admin/sprints/orders");
      setOrdersList(response.data);

      // Fetch sessions for each sprint
      const sessionsMap: Record<string, any[]> = {};

      for (const sprint of sprintsList) {
        try {
          const sessionsResponse = await axios.get(`/api/admin/sprints/${sprint.id}/sessions`);
          sessionsMap[sprint.id] = sessionsResponse.data;
        } catch (err) {
          console.error(`Failed to load sessions for sprint ${sprint.id}:`, err);
          sessionsMap[sprint.id] = [];
        }
      }

      setSessionsData(sessionsMap);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders log");
    }
  };

  const handleVerifyOrder = async (orderId: string) => {
    try {
      const response = await axios.patch(`/api/admin/sprints/orders/${orderId}/verify`);
      const { isVerified } = response.data;
      toast.success(isVerified ? "Order verified!" : "Order unverified!");
      fetchOrders();
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Failed to update verification status");
      } else {
        toast.error("Failed to update verification status");
      }
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintTitle || !newSprintSlug) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await axios.post("/api/admin/sprints", {
        title: newSprintTitle,
        slug: newSprintSlug,
        basePrice: newSprintPrice,
      });
      toast.success("Sprint created successfully!");
      setCreateDialogOpen(false);
      setNewSprintTitle("");
      setNewSprintSlug("");
      setNewSprintPrice(4999);
      fetchSprints();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to create sprint";
      toast.error(errorMessage);
    }
  };

  const startEditSprint = async (sprintId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/sprints/${sprintId}`);
      const data = response.data;
      const urls = data.coverImageUrls || [];
      const coverImageUrls = [
        urls[0] || data.coverImageUrl || "",
        urls[1] || "",
        urls[2] || "",
      ];
      setEditingSprint({
        ...data,
        coverImageUrls,
        sessionsHeading: data.sessionsHeading || "Sprint Sessions & Curriculum",
        testimonialsHeading: data.testimonialsHeading || "What Members Say About Our Ecosystem",
        faqsHeading: data.faqsHeading || "Frequently Asked Questions",
        whoIsThisForHeading: data.whoIsThisForHeading || "Who Is This For?",
      });
      setActiveEditTab("details");
      setEditDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sprint details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSprint = async () => {
    if (!editingSprint) return;
    setIsLoading(true);
    try {
      // Exclude mentors, sessions, faqs to ensure single source of truth and no accidental wipes
      const { mentors: _mentors, sessions: _sessions, faqs: _faqs, ...payload } = editingSprint as any;
      await axios.put(`/api/admin/sprints/${editingSprint.id}`, payload);
      toast.success("Sprint saved successfully!");
      setEditDialogOpen(false);
      fetchSprints();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save sprint");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSprint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sprint? This cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/sprints/${id}`);
      toast.success("Sprint deleted");
      fetchSprints();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete sprint");
    }
  };

  const handleImageUpload = async (file: File, callback: (url: string) => void) => {
    setIsUploading(true);
    try {
      const { publicUrl } = await uploadFileViaSignedUrl({
        domain: "ungatekeep-images",
        file,
      });
      callback(publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Export to CSV for Orders Log
  const exportOrdersCSV = () => {
    if (ordersList.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = [
      "Order ID",
      "Buyer Name",
      "Buyer Email",
      "Buyer Phone",
      "Buddy Email",
      "Sprint Title",
      "Selected Tier / Upgrade Plan",
      "Amount Paid (INR)",
      "Coupon Code",
      "Razorpay Order ID",
      "Razorpay Payment ID",
      "Status",
      "Date",
    ];

    const rows = ordersList.map((order) => [
      order.id,
      order.buyerName,
      order.buyerEmail,
      order.buyerPhone || "",
      order.buddyEmail || "",
      order.sprintTitle || "",
      order.upgradePlanTitle
        ? `Upgrade: ${order.upgradePlanTitle}`
        : (order.tierName || "Base price"),
      (order.amountPaid / 100).toFixed(2),
      order.couponCode || "",
      order.razorpayOrderId,
      order.razorpayPaymentId || "",
      order.status,
      new Date(order.createdAt).toLocaleString(),
    ]);

    const sanitizeCSV = (val: string): string => {
      if (/^[=+\-@]/.test(val)) return `\t${val}`;
      return val;
    };

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${sanitizeCSV(String(val)).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sprint_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV for Registration Details
  const exportRegistrationsCSV = () => {
    const registrations = ordersList.filter((order) => order.registrationName || order.buyerName);
    if (registrations.length === 0) {
      toast.error("No registration details to export");
      return;
    }

    const headers = [
      "Name",
      "College",
      "Course",
      "Year",
      "Expectations",
      "Opted Plan / Upgrade",
      "Selected Sessions",
      "Individual Sessions",
      "Sprint",
      "Email",
      "Date",
    ];

    const rows = registrations.map((order) => {
      const sessionTitles =
        order.selectedSessionIds && order.selectedSessionIds.length > 0
          ? order.selectedSessionIds
              .map((sessionId) => {
                const session = order.sprintId
                  ? sessionsData[order.sprintId]?.find((s: any) => s.id === sessionId)
                  : null;
                return session ? session.title : "";
              })
              .filter(Boolean)
              .join(", ")
          : "";

      const individualSessionTitles =
        order.selectedAddOnIds && order.selectedAddOnIds.length > 0
          ? order.selectedAddOnIds
              .map((sessionId) => {
                const session = order.sprintId
                  ? sessionsData[order.sprintId]?.find((s: any) => s.id === sessionId)
                  : null;
                return session ? session.title : "";
              })
              .filter(Boolean)
              .join(", ")
          : "";

      const optedPlanLabel = order.upgradePlanTitle
        ? `Upgrade: ${order.upgradePlanTitle} (Paid: ₹${(order.amountPaid / 100).toFixed(2)})`
        : `${order.tierName || "Base Plan"} (Paid: ₹${(order.amountPaid / 100).toFixed(2)})`;

      return [
        order.registrationName || order.buyerName,
        order.registrationCollege || "",
        order.registrationCourse || "",
        order.registrationYear || "",
        order.registrationExpectations || "",
        optedPlanLabel,
        sessionTitles,
        individualSessionTitles,
        order.sprintTitle || "Unknown",
        order.buyerEmail,
        order.registrationCompletedAt
          ? new Date(order.registrationCompletedAt).toLocaleString()
          : new Date(order.createdAt).toLocaleString(),
      ];
    });

    const sanitizeCSV = (val: string): string => {
      if (/^[=+\-@]/.test(val)) return `\t${val}`;
      return val;
    };

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${sanitizeCSV(String(val)).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sprint_registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Switcher */}
      <div className="flex border-b">
        <button
          onClick={() => setView("sprints")}
          className={`px-4 py-2 font-medium border-b-2 text-sm transition-all ${
            view === "sprints"
              ? "border-[#ff5e14] text-[#ff5e14]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Sprints ({sprintsList.length})
        </button>
        <button
          onClick={() => setView("orders")}
          className={`px-4 py-2 font-medium border-b-2 text-sm transition-all ${
            view === "orders"
              ? "border-[#ff5e14] text-[#ff5e14]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Orders Log ({ordersList.length})
        </button>
        <button
          onClick={() => setView("registrations")}
          className={`px-4 py-2 font-medium border-b-2 text-sm transition-all ${
            view === "registrations"
              ? "border-[#ff5e14] text-[#ff5e14]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Registration Details ({ordersList.filter((order) => order.registrationName).length})
        </button>
      </div>

      {view === "sprints" ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sprint Management</h2>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-[#ff5e14] hover:bg-[#e04f0f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Sprint
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#ff5e14]" />
            </div>
          ) : sprintsList.length === 0 ? (
            <div className="border bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">No sprints built yet.</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="outline"
                className="border-[#ff5e14] text-[#ff5e14] hover:bg-orange-50"
              >
                Create your first sprint
              </Button>
            </div>
          ) : (
            <div className="border bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-4 font-semibold text-gray-700">Sprint Title</th>
                      <th className="p-4 font-semibold text-gray-700">Slug (URL)</th>
                      <th className="p-4 font-semibold text-gray-700">Base Price</th>
                      <th className="p-4 font-semibold text-gray-700">Status</th>
                      <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sprintsList.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">{s.title}</td>
                        <td className="p-4 text-gray-500">/toolkit/sprints/{s.slug}</td>
                        <td className="p-4 font-semibold text-gray-900">₹{s.basePrice}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              s.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {s.isActive ? "Active" : "Draft"}
                          </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-1.5 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setManagingSprint(s);
                              setSessionManagerOpen(true);
                            }}
                            className="text-gray-600 hover:text-gray-900 text-xs"
                          >
                            <FolderCog className="w-4 h-4 mr-1" /> Sessions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setManagingSprint(s);
                              setUpgradePlansOpen(true);
                            }}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs"
                          >
                            <Layers className="w-4 h-4 mr-1" /> Upgrade Plans
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setManagingSprint(s);
                              setMentorManagerOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
                          >
                            <Users className="w-4 h-4 mr-1" /> Mentors
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setManagingSprint(s);
                              setFaqManagerOpen(true);
                            }}
                            className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-xs"
                          >
                            <HelpCircle className="w-4 h-4 mr-1" /> FAQs
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditSprint(s.id)}
                            className="text-gray-600 hover:text-gray-900 text-xs"
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSprint(s.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : view === "orders" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Orders Log</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                All purchase attempts, successful payments, and transaction logs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportOrdersCSV}
                variant="outline"
                className="flex gap-1.5 items-center border-gray-300 hover:bg-gray-50 text-gray-700 text-xs"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Orders Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setOrderStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  orderStatusFilter === "all"
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                All ({ordersList.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter("paid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  orderStatusFilter === "paid"
                    ? "bg-green-600 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                Paid ({ordersList.filter((o) => o.status === "paid").length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter("created")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  orderStatusFilter === "created"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                Pending / Created ({ordersList.filter((o) => o.status === "created" || o.status === "pending").length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter("failed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  orderStatusFilter === "failed"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                Failed ({ordersList.filter((o) => o.status === "failed").length})
              </button>
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Search buyer, email, order ID..."
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                className="bg-white text-xs h-8"
              />
            </div>
          </div>

          {(() => {
            const filteredOrders = ordersList.filter((order) => {
              if (orderStatusFilter === "paid" && order.status !== "paid") return false;
              if (orderStatusFilter === "created" && order.status !== "created" && order.status !== "pending") return false;
              if (orderStatusFilter === "failed" && order.status !== "failed") return false;

              if (orderSearchTerm.trim()) {
                const term = orderSearchTerm.toLowerCase();
                const matchesBuyer = order.buyerName?.toLowerCase().includes(term);
                const matchesEmail = order.buyerEmail?.toLowerCase().includes(term);
                const matchesOrder = order.razorpayOrderId?.toLowerCase().includes(term);
                const matchesPay = order.razorpayPaymentId?.toLowerCase().includes(term);
                const matchesSprint = order.sprintTitle?.toLowerCase().includes(term);
                if (!matchesBuyer && !matchesEmail && !matchesOrder && !matchesPay && !matchesSprint) {
                  return false;
                }
              }
              return true;
            });

            if (filteredOrders.length === 0) {
              return (
                <div className="border bg-white rounded-lg p-12 text-center">
                  <p className="text-gray-500">No orders found matching the selected filter.</p>
                </div>
              );
            }

            return (
              <div className="border bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-4 font-semibold text-gray-700">Buyer</th>
                        <th className="p-4 font-semibold text-gray-700">Buddy (Referral)</th>
                        <th className="p-4 font-semibold text-gray-700">Sprint &amp; Tier / Upgrade Plan</th>
                        <th className="p-4 font-semibold text-gray-700">Paid</th>
                        <th className="p-4 font-semibold text-gray-700">Coupon</th>
                        <th className="p-4 font-semibold text-gray-700">Razorpay Info</th>
                        <th className="p-4 font-semibold text-gray-700">Status</th>
                        <th className="p-4 font-semibold text-gray-700">Registration</th>
                        <th className="p-4 font-semibold text-gray-700">Verified</th>
                        <th className="p-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <div className="font-semibold text-gray-900">{order.buyerName}</div>
                            <div className="text-xs text-gray-500">{order.buyerEmail}</div>
                            {order.buyerPhone && (
                              <div className="text-xs text-gray-400">{order.buyerPhone}</div>
                            )}
                          </td>
                          <td className="p-4">
                            {order.buddyEmail ? (
                              <div>
                                <span className="inline-flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full border border-orange-100 bg-orange-50 text-[10px] font-bold text-[#ff5e14]">
                                  <Gift className="w-3 h-3" /> Buddy Added
                                </span>
                                <div className="select-all text-xs font-medium text-gray-600">
                                  {order.buddyEmail}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-normal italic text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-950">{order.sprintTitle || "Unknown"}</div>
                            {order.upgradePlanTitle ? (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-[11px] font-bold text-amber-800">
                                  Upgrade: {order.upgradePlanTitle}
                                </span>
                                {order.upgradePlanSectionLabel && (
                                  <div className="mt-0.5 text-[10px] text-gray-500">
                                    {order.upgradePlanSectionLabel}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-[#ff5e14]">{order.tierName || "Base price"}</div>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-gray-900">
                            ₹{(order.amountPaid / 100).toFixed(2)}
                          </td>
                          <td className="p-4 text-gray-600">
                            {order.couponId ? (
                              <div>
                                <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">
                                  Yes
                                </span>
                                {order.couponCode && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({order.couponCode})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                                No
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-gray-500">
                            <div>Order: {order.razorpayOrderId}</div>
                            {order.razorpayPaymentId && (
                              <div className="text-emerald-700 font-medium">
                                Pay ID: {order.razorpayPaymentId}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                order.status === "paid"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : order.status === "failed"
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {order.status === "paid"
                                ? "Paid"
                                : order.status === "failed"
                                ? "Failed"
                                : "Pending"}
                            </span>
                          </td>
                          <td className="p-4 text-xs">
                            {order.registrationName ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  Registered
                                </span>
                                <div className="text-gray-900 font-medium truncate max-w-[140px]">{order.registrationName}</div>
                                <div className="text-gray-500 truncate max-w-[140px]">{order.registrationCollege}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Not Submitted</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Button
                              onClick={() => handleVerifyOrder(order.id)}
                              variant={order.isVerified ? "outline" : "default"}
                              size="sm"
                              disabled={order.status !== "paid"}
                              className={`text-xs ${
                                order.isVerified
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "bg-green-600 hover:bg-green-700 text-white"
                              }`}
                            >
                              {order.isVerified ? "Unverify" : "Verify"}
                            </Button>
                          </td>
                          <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString()}{" "}
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      ) : view === "registrations" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Registration Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Detailed demographics and responses from students who completed their registration form.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportRegistrationsCSV}
                variant="outline"
                className="flex gap-1.5 items-center border-gray-300 hover:bg-gray-50 text-gray-700 text-xs"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Registration Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-700">
              Completed Registrations ({ordersList.filter((o) => o.registrationName).length})
            </div>
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search student, college, email, course..."
                value={registrationSearchTerm}
                onChange={(e) => setRegistrationSearchTerm(e.target.value)}
                className="bg-white text-xs h-8"
              />
            </div>
          </div>

          {(() => {
            const allRegistrations = ordersList.filter((order) => order.registrationName);

            if (allRegistrations.length === 0) {
              return (
                <div className="border bg-white rounded-lg p-12 text-center">
                  <p className="text-gray-500">No registration details available yet.</p>
                </div>
              );
            }

            const filteredRegistrations = allRegistrations.filter((order) => {
              if (!registrationSearchTerm.trim()) return true;
              const term = registrationSearchTerm.toLowerCase();
              const matchesName = (order.registrationName || order.buyerName)?.toLowerCase().includes(term);
              const matchesEmail = order.buyerEmail?.toLowerCase().includes(term);
              const matchesCollege = order.registrationCollege?.toLowerCase().includes(term);
              const matchesCourse = order.registrationCourse?.toLowerCase().includes(term);
              const matchesSprint = order.sprintTitle?.toLowerCase().includes(term);
              const matchesPlan = order.upgradePlanTitle?.toLowerCase().includes(term) || order.tierName?.toLowerCase().includes(term);
              return matchesName || matchesEmail || matchesCollege || matchesCourse || matchesSprint || matchesPlan;
            });

            if (filteredRegistrations.length === 0) {
              return (
                <div className="border bg-white rounded-lg p-12 text-center">
                  <p className="text-gray-500">No registered students found matching your search.</p>
                </div>
              );
            }

            return (
              <div className="border bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[1000px]">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-4 font-semibold text-gray-700">Name</th>
                        <th className="p-4 font-semibold text-gray-700">College</th>
                        <th className="p-4 font-semibold text-gray-700">Course</th>
                        <th className="p-4 font-semibold text-gray-700">Year</th>
                        <th className="p-4 font-semibold text-gray-700">Expectations</th>
                        <th className="p-4 font-semibold text-gray-700">Opted Plan / Upgrade</th>
                        <th className="p-4 font-semibold text-gray-700">Selected Sessions</th>
                        <th className="p-4 font-semibold text-gray-700">Individual Sessions</th>
                        <th className="p-4 font-semibold text-gray-700">Sprint</th>
                        <th className="p-4 font-semibold text-gray-700">Email</th>
                        <th className="p-4 font-semibold text-gray-700">Date</th>
                        <th className="p-4 font-semibold text-gray-700">Manage Packages</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredRegistrations.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-900">
                            {order.registrationName || order.buyerName}
                          </td>
                          <td className="p-4 text-gray-600">{order.registrationCollege || "-"}</td>
                          <td className="p-4 text-gray-600">{order.registrationCourse || "-"}</td>
                          <td className="p-4 text-gray-600">{order.registrationYear || "-"}</td>
                          <td className="p-4 text-gray-600">
                            {order.registrationExpectations || "-"}
                          </td>
                          <td className="p-4 text-gray-900">
                            {order.upgradePlanTitle ? (
                              <div>
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-xs font-bold rounded">
                                  Upgrade: {order.upgradePlanTitle}
                                </span>
                                <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                                  Paid: ₹{(order.amountPaid / 100).toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-block bg-orange-50 text-[#ff5e14] border border-orange-200 text-xs px-2 py-0.5 rounded font-semibold">
                                  {order.tierName || "Base Plan"}
                                </span>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  Paid: ₹{(order.amountPaid / 100).toFixed(2)}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-gray-600">
                            {order.selectedSessionIds && order.selectedSessionIds.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {order.selectedSessionIds.map((sessionId) => {
                                  const session = order.sprintId
                                    ? sessionsData[order.sprintId]?.find(
                                        (s: any) => s.id === sessionId
                                      )
                                    : null;
                                  return session ? (
                                    <span
                                      key={sessionId}
                                      className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded"
                                    >
                                      {session.title}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-4 text-gray-600">
                            {order.selectedAddOnIds && order.selectedAddOnIds.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {order.selectedAddOnIds.map((sessionId) => {
                                  const session = order.sprintId
                                    ? sessionsData[order.sprintId]?.find(
                                        (s: any) => s.id === sessionId
                                      )
                                    : null;
                                  return session ? (
                                    <span
                                      key={sessionId}
                                      className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
                                    >
                                      {session.title}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-4 text-gray-900">{order.sprintTitle || "Unknown"}</td>
                          <td className="p-4 text-gray-500 text-xs">{order.buyerEmail}</td>
                          <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                            {order.registrationCompletedAt
                              ? new Date(order.registrationCompletedAt).toLocaleDateString()
                              : new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!order.sprintId}
                              onClick={() =>
                                setManagePackagesModalState({
                                  open: true,
                                  sprintId: order.sprintId || "",
                                  userId: order.userId || "",
                                  userName: order.registrationName || order.buyerName,
                                  userEmail: order.buyerEmail,
                                  userTierName: order.tierName || undefined,
                                  isBundleUser: Boolean(
                                    order.tierName ||
                                      !order.selectedAddOnIds ||
                                      order.selectedAddOnIds.length === 0
                                  ),
                                })
                              }
                              className="text-xs font-semibold border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Manage Packages
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}

      {/* Sprint Creation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Sprint Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSprint} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Program Title</Label>
              <Input
                id="title"
                placeholder="e.g. 10-Day UI/UX Growth Sprint"
                value={newSprintTitle}
                onChange={(e) => {
                  setNewSprintTitle(e.target.value);
                  setNewSprintSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")
                  );
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Custom URL Slug</Label>
              <Input
                id="slug"
                placeholder="e.g. uiux-growth-sprint"
                value={newSprintSlug}
                onChange={(e) => setNewSprintSlug(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Base Price (INR)</Label>
              <Input
                id="price"
                type="number"
                value={newSprintPrice}
                onChange={(e) => setNewSprintPrice(Number(e.target.value))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#ff5e14] hover:bg-[#e04f0f] text-white">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sprint Editing Dialog */}
      {editingSprint && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader className="flex flex-row justify-between items-center border-b pb-4 mb-4">
              <div>
                <DialogTitle className="text-xl">Configure Program: {editingSprint.title}</DialogTitle>
                <p className="text-sm text-gray-500">Edit page sections, pricing tiers, and mentors</p>
              </div>
            </DialogHeader>

            {/* Modal Tabs */}
            <div className="flex gap-2 border-b mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveEditTab("details")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "details"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Page Details &amp; Hero
              </button>
              <button
                onClick={() => setActiveEditTab("mentors")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "mentors"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Mentors ({editingSprint.mentors?.length || 0})
              </button>
              <button
                onClick={() => setActiveEditTab("features")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "features"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                What You Get ({editingSprint.features?.length || 0})
              </button>
              <button
                onClick={() => setActiveEditTab("pricing")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "pricing"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Pricing, Tiers &amp; Add-ons
              </button>
              <button
                onClick={() => setActiveEditTab("curriculum")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "curriculum"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Curriculum ({editingSprint.sessions?.length || 0})
              </button>
              <button
                onClick={() => setActiveEditTab("faqs")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "faqs"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                FAQs ({editingSprint.faqs?.length || 0})
              </button>
            </div>

            {/* details Tab */}
            {activeEditTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={editingSprint.title}
                      onChange={(e) => setEditingSprint({ ...editingSprint, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slug</Label>
                    <Input
                      value={editingSprint.slug}
                      onChange={(e) => setEditingSprint({ ...editingSprint, slug: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description / Subtitle</Label>
                    <Textarea
                      rows={3}
                      value={editingSprint.subtitle || ""}
                      onChange={(e) =>
                        setEditingSprint({ ...editingSprint, subtitle: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Linked Content Toolkit</Label>
                    <select
                      value={editingSprint.toolkitId || ""}
                      onChange={(e) =>
                        setEditingSprint({ ...editingSprint, toolkitId: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="">-- None (No toolkit content linked) --</option>
                      {toolkits.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.category || "No Category"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sprint Start Date / Dates</Label>
                    <Input
                      value={editingSprint.startDate || ""}
                      onChange={(e) =>
                        setEditingSprint({ ...editingSprint, startDate: e.target.value })
                      }
                      placeholder="e.g. Starts 20th Oct • 2 Weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Card Highlights / Key Features</Label>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {(editingSprint.highlights || []).map((highlight, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            value={highlight}
                            onChange={(e) => {
                              const newHighlights = [...(editingSprint.highlights || [])];
                              newHighlights[idx] = e.target.value;
                              setEditingSprint({ ...editingSprint, highlights: newHighlights });
                            }}
                            placeholder={`Feature #${idx + 1}`}
                            className="flex-1 text-sm h-8"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newHighlights = (editingSprint.highlights || []).filter(
                                (_, i) => i !== idx
                              );
                              setEditingSprint({ ...editingSprint, highlights: newHighlights });
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newHighlights = [...(editingSprint.highlights || []), ""];
                        setEditingSprint({ ...editingSprint, highlights: newHighlights });
                      }}
                      className="text-xs font-bold text-[#ff5e14] hover:underline flex items-center gap-1.5 pt-1"
                    >
                      + Add Key Feature
                    </button>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs font-semibold">Who Is This For? - Section Heading</Label>
                    <Input
                      value={editingSprint.whoIsThisForHeading || ""}
                      onChange={(e) =>
                        setEditingSprint({
                          ...editingSprint,
                          whoIsThisForHeading: e.target.value,
                        })
                      }
                      placeholder="e.g. Who Is This For?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Who Is This For? - Bullet Points</Label>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {(editingSprint.whoIsThisForBullets || []).map((bullet, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            value={bullet}
                            onChange={(e) => {
                              const newBullets = [...(editingSprint.whoIsThisForBullets || [])];
                              newBullets[idx] = e.target.value;
                              setEditingSprint({
                                ...editingSprint,
                                whoIsThisForBullets: newBullets,
                              });
                            }}
                            placeholder={`Point #${idx + 1}`}
                            className="flex-1 text-sm h-8"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newBullets = (
                                editingSprint.whoIsThisForBullets || []
                              ).filter((_, i) => i !== idx);
                              setEditingSprint({
                                ...editingSprint,
                                whoIsThisForBullets: newBullets,
                              });
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newBullets = [...(editingSprint.whoIsThisForBullets || []), ""];
                        setEditingSprint({
                          ...editingSprint,
                          whoIsThisForBullets: newBullets,
                        });
                      }}
                      className="text-xs font-bold text-[#ff5e14] hover:underline flex items-center gap-1.5 pt-1"
                    >
                      + Add Target Audience Point
                    </button>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-4">
                  {/* Top Banner Video Preview */}
                  <div className="border p-3 rounded-xl bg-gray-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-[#ff5e14]" /> Top Banner Video URL (Optional)
                      </Label>
                      {editingSprint.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingSprint({ ...editingSprint, videoUrl: "" })}
                          className="text-[10px] text-red-500 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="YouTube, Instagram Reel, or Bunny CDN stream URL"
                      value={editingSprint.videoUrl || ""}
                      onChange={(e) =>
                        setEditingSprint({ ...editingSprint, videoUrl: e.target.value })
                      }
                      className="text-xs"
                    />
                    {(() => {
                      if (!editingSprint.videoUrl?.trim()) return null;
                      const embed = getVideoEmbedInfo(editingSprint.videoUrl);
                      if (!embed) {
                        return (
                          <p className="text-[11px] text-amber-600">
                            URL entered is not recognized as a supported YouTube, Instagram, or Bunny CDN video.
                          </p>
                        );
                      }
                      return (
                        <div className="pt-1">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1 mb-1">
                            <Play className="w-3 h-3" /> Detected: {embed.provider}
                          </span>
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-black">
                            {embed.provider === "youtube" || embed.provider === "bunny" ? (
                              <iframe
                                src={embed.embedUrl}
                                title="Preview"
                                className="w-full h-full border-0"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={embed.embedUrl}
                                controls
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-gray-800 block">
                      Hero Banner Images (Max 3 for Carousel)
                    </Label>

                    {/* Banner 1 */}
                    <div className="border p-3 rounded-xl bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">
                          1. Hero Banner Image (Primary)
                        </span>
                        {editingSprint.coverImageUrl && (
                          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-150">
                            Active
                          </span>
                        )}
                      </div>
                      {editingSprint.coverImageUrl && (
                        <img
                          src={editingSprint.coverImageUrl}
                          alt="Primary banner preview"
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                      )}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                          Upload Image File
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) => {
                                  const urls = [...(editingSprint.coverImageUrls || [])];
                                  urls[0] = url;
                                  setEditingSprint({
                                    ...editingSprint,
                                    coverImageUrl: url,
                                    coverImageUrls: urls,
                                  });
                                });
                              }
                            }}
                          />
                          {isUploading && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                          Or Image URL
                        </Label>
                        <Input
                          value={editingSprint.coverImageUrl || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const urls = [...(editingSprint.coverImageUrls || [])];
                            urls[0] = val;
                            setEditingSprint({
                              ...editingSprint,
                              coverImageUrl: val,
                              coverImageUrls: urls,
                            });
                          }}
                          placeholder="https://example.com/banner-primary.jpg"
                        />
                      </div>
                    </div>

                    {/* Banner 2 */}
                    <div className="border p-3 rounded-xl bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">
                          2. Hero Banner Image 2 (Optional)
                        </span>
                        {editingSprint.coverImageUrls?.[1] && (
                          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-150">
                            Active
                          </span>
                        )}
                      </div>
                      {editingSprint.coverImageUrls?.[1] && (
                        <img
                          src={editingSprint.coverImageUrls[1]}
                          alt="Banner 2 preview"
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                      )}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                          Upload Image File
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) => {
                                  const urls = [...(editingSprint.coverImageUrls || [])];
                                  urls[1] = url;
                                  setEditingSprint({
                                    ...editingSprint,
                                    coverImageUrls: urls,
                                  });
                                });
                              }
                            }}
                          />
                          {isUploading && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                          Or Image URL
                        </Label>
                        <Input
                          value={editingSprint.coverImageUrls?.[1] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const urls = [...(editingSprint.coverImageUrls || [])];
                            urls[1] = val;
                            setEditingSprint({
                              ...editingSprint,
                              coverImageUrls: urls,
                            });
                          }}
                          placeholder="https://example.com/banner-2.jpg"
                        />
                      </div>
                    </div>

                    {/* Banner 3 */}
                    <div className="border p-3 rounded-xl bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">
                          3. Hero Banner Image 3 (Optional)
                        </span>
                        {editingSprint.coverImageUrls?.[2] && (
                          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-150">
                            Active
                          </span>
                        )}
                      </div>
                      {editingSprint.coverImageUrls?.[2] && (
                        <img
                          src={editingSprint.coverImageUrls[2]}
                          alt="Banner 3 preview"
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                      )}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                          Upload Image File
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) => {
                                  const urls = [...(editingSprint.coverImageUrls || [])];
                                  urls[2] = url;
                                  setEditingSprint({
                                    ...editingSprint,
                                    coverImageUrls: urls,
                                  });
                                });
                              }
                            }}
                          />
                          {isUploading && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                          Or Image URL
                        </Label>
                        <Input
                          value={editingSprint.coverImageUrls?.[2] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const urls = [...(editingSprint.coverImageUrls || [])];
                            urls[2] = val;
                            setEditingSprint({
                              ...editingSprint,
                              coverImageUrls: urls,
                            });
                          }}
                          placeholder="https://example.com/banner-3.jpg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Card Cover Image (Optional - fallback to Hero)</Label>
                    {editingSprint.cardImageUrl && (
                      <img
                        src={editingSprint.cardImageUrl}
                        alt="Card cover preview"
                        className="w-full h-32 object-cover rounded-lg border mb-2"
                      />
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, (url) =>
                              setEditingSprint({ ...editingSprint, cardImageUrl: url })
                            );
                          }
                        }}
                      />
                      {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Mentors Section Heading</Label>
                    <Input
                      value={editingSprint.mentorsHeading || "Meet Your Mentors"}
                      onChange={(e) =>
                        setEditingSprint({ ...editingSprint, mentorsHeading: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Mentors Show Limit</Label>
                      <Input
                        type="number"
                        value={editingSprint.mentorsLimit ?? 2}
                        onChange={(e) =>
                          setEditingSprint({
                            ...editingSprint,
                            mentorsLimit: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mentors View All Link</Label>
                      <Input
                        value={editingSprint.mentorsLinkTarget || ""}
                        onChange={(e) =>
                          setEditingSprint({ ...editingSprint, mentorsLinkTarget: e.target.value })
                        }
                        placeholder="/mentors or #all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Features Section Heading</Label>
                    <Input
                      value={editingSprint.featuresHeading || "What You Get"}
                      onChange={(e) =>
                        setEditingSprint({ ...editingSprint, featuresHeading: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Curriculum / Sessions Section Heading</Label>
                    <Input
                      value={editingSprint.sessionsHeading || ""}
                      onChange={(e) =>
                        setEditingSprint({ ...editingSprint, sessionsHeading: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Testimonials Section Heading</Label>
                    <Input
                      value={editingSprint.testimonialsHeading || ""}
                      onChange={(e) =>
                        setEditingSprint({
                          ...editingSprint,
                          testimonialsHeading: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>FAQs Section Heading</Label>
                    <Input
                      value={editingSprint.faqsHeading || "Frequently Asked Questions"}
                      onChange={(e) =>
                        setEditingSprint({ ...editingSprint, faqsHeading: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sprint-active"
                        checked={editingSprint.isActive}
                        onCheckedChange={(val) =>
                          setEditingSprint({ ...editingSprint, isActive: val })
                        }
                      />
                      <Label htmlFor="sprint-active">Active (Visible to public)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sprint-best-seller"
                        checked={!!editingSprint.isBestSeller}
                        onCheckedChange={(val) =>
                          setEditingSprint({ ...editingSprint, isBestSeller: val })
                        }
                      />
                      <Label htmlFor="sprint-best-seller">Best Seller Tag</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sprint-filling-fast"
                        checked={!!editingSprint.isFillingFast}
                        onCheckedChange={(val) =>
                          setEditingSprint({ ...editingSprint, isFillingFast: val })
                        }
                      />
                      <Label htmlFor="sprint-filling-fast">Filling Fast Tag</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sprint-verification-required"
                        checked={editingSprint.isVerificationRequired}
                        onCheckedChange={(val) =>
                          setEditingSprint({ ...editingSprint, isVerificationRequired: val })
                        }
                      />
                      <Label htmlFor="sprint-verification-required">
                        Require Admin Verification Before Access
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* mentors Tab */}
            {activeEditTab === "mentors" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-md font-semibold">Sprint Mentors</h3>
                    <p className="text-xs text-gray-500">
                      Manage featured instructors and guest mentors for this sprint.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setManagingSprint(editingSprint);
                      setMentorManagerOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    size="sm"
                  >
                    <Users className="w-3.5 h-3.5 mr-1" /> Open Mentor Manager
                  </Button>
                </div>

                <div className="border rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">
                    {editingSprint.mentors?.length || 0} Mentors Configured
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Use the dedicated Mentor Manager to add photos, titles, bios, and LinkedIn profiles safely.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setManagingSprint(editingSprint);
                      setMentorManagerOpen(true);
                    }}
                    className="text-xs border-gray-300"
                  >
                    Manage Mentors
                  </Button>
                </div>
              </div>
            )}

            {/* features Tab */}
            {activeEditTab === "features" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-semibold">Features &amp; Deliverables</h3>
                  <Button
                    onClick={() => {
                      const currentFeatures = editingSprint.features || [];
                      setEditingSprint({
                        ...editingSprint,
                        features: [
                          ...currentFeatures,
                          { icon: "Check", title: "", description: "" },
                        ],
                      });
                    }}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border text-xs"
                    size="sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Feature Card
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(editingSprint.features || []).map((feature, index) => (
                    <div
                      key={index}
                      className="border p-4 rounded-lg bg-gray-50 flex gap-4 relative"
                    >
                      <button
                        onClick={() => {
                          const currentFeatures = [...(editingSprint.features || [])];
                          currentFeatures.splice(index, 1);
                          setEditingSprint({ ...editingSprint, features: currentFeatures });
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Icon Name</Label>
                          <Input
                            value={feature.icon}
                            onChange={(e) => {
                              const currentFeatures = [...(editingSprint.features || [])];
                              currentFeatures[index] = {
                                ...currentFeatures[index],
                                icon: e.target.value,
                              };
                              setEditingSprint({ ...editingSprint, features: currentFeatures });
                            }}
                            placeholder="e.g. Video, FileText, Check"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Feature Title</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) => {
                              const currentFeatures = [...(editingSprint.features || [])];
                              currentFeatures[index] = {
                                ...currentFeatures[index],
                                title: e.target.value,
                              };
                              setEditingSprint({ ...editingSprint, features: currentFeatures });
                            }}
                            placeholder="e.g. 1-on-1 Portfolio Reviews"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={feature.description}
                            onChange={(e) => {
                              const currentFeatures = [...(editingSprint.features || [])];
                              currentFeatures[index] = {
                                ...currentFeatures[index],
                                description: e.target.value,
                              };
                              setEditingSprint({ ...editingSprint, features: currentFeatures });
                            }}
                            placeholder="e.g. Detailed feedback on assignments"
                          />
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex flex-col justify-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => {
                            const currentFeatures = [...(editingSprint.features || [])];
                            const temp = currentFeatures[index];
                            currentFeatures[index] = currentFeatures[index - 1];
                            currentFeatures[index - 1] = temp;
                            setEditingSprint({ ...editingSprint, features: currentFeatures });
                          }}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === (editingSprint.features?.length || 0) - 1}
                          onClick={() => {
                            const currentFeatures = [...(editingSprint.features || [])];
                            const temp = currentFeatures[index];
                            currentFeatures[index] = currentFeatures[index + 1];
                            currentFeatures[index + 1] = temp;
                            setEditingSprint({ ...editingSprint, features: currentFeatures });
                          }}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* pricing Tab */}
            {activeEditTab === "pricing" && (
              <div className="space-y-6">
                <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
                  <h3 className="text-md font-semibold">Base Price Setup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Investment Section Heading</Label>
                      <Input
                        value={editingSprint.investmentLabel || "Total Investment"}
                        onChange={(e) =>
                          setEditingSprint({ ...editingSprint, investmentLabel: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Standard Base Price (INR)</Label>
                      <Input
                        type="number"
                        value={editingSprint.basePrice}
                        onChange={(e) =>
                          setEditingSprint({
                            ...editingSprint,
                            basePrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Original Price (Strikethrough - Optional)</Label>
                      <Input
                        type="number"
                        value={editingSprint.originalPrice || ""}
                        onChange={(e) =>
                          setEditingSprint({
                            ...editingSprint,
                            originalPrice: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        placeholder="e.g. 9999"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sprint-early-bird"
                        checked={!!editingSprint.hasEarlyBird}
                        onCheckedChange={(val) =>
                          setEditingSprint({ ...editingSprint, hasEarlyBird: val })
                        }
                      />
                      <Label htmlFor="sprint-early-bird">Enable Early Bird Top Marquee Banner</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sprint-early-bird-checkout"
                        checked={!!editingSprint.showEarlyBirdCheckout}
                        onCheckedChange={(val) =>
                          setEditingSprint({ ...editingSprint, showEarlyBirdCheckout: val })
                        }
                      />
                      <Label htmlFor="sprint-early-bird-checkout">
                        Show Early Bird Tag in Checkout Drawer
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sprint-early-bird-marquee-checkout"
                        checked={!!editingSprint.showEarlyBirdMarqueeCheckout}
                        onCheckedChange={(val) =>
                          setEditingSprint({
                            ...editingSprint,
                            showEarlyBirdMarqueeCheckout: val,
                          })
                        }
                      />
                      <Label htmlFor="sprint-early-bird-marquee-checkout">
                        Show Top Marquee Bar inside Checkout Drawer
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sprint-addons-checkout"
                        checked={editingSprint.showAddonsCheckout !== false}
                        onCheckedChange={(val) =>
                          setEditingSprint({ ...editingSprint, showAddonsCheckout: val })
                        }
                      />
                      <Label htmlFor="sprint-addons-checkout">
                        Show Toolkit Upsells &amp; Add-ons in Checkout Drawer
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Tiers Management */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-semibold">Tier Packages</h3>
                    <Button
                      onClick={() => {
                        const currentTiers = editingSprint.tiers || [];
                        setEditingSprint({
                          ...editingSprint,
                          tiers: [
                            ...currentTiers,
                            {
                              name: "",
                              price: 0,
                              description: "",
                              whatIncluded: [],
                              isDefault: false,
                            },
                          ],
                        });
                      }}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border text-xs"
                      size="sm"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Tier
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(editingSprint.tiers || []).map((tier, index) => (
                      <div
                        key={index}
                        className="border p-4 rounded-lg bg-gray-50 flex flex-col gap-4 relative"
                      >
                        <button
                          onClick={() => {
                            const currentTiers = [...(editingSprint.tiers || [])];
                            currentTiers.splice(index, 1);
                            setEditingSprint({ ...editingSprint, tiers: currentTiers });
                          }}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Tier Name</Label>
                            <Input
                              value={tier.name}
                              onChange={(e) => {
                                const currentTiers = [...(editingSprint.tiers || [])];
                                currentTiers[index] = {
                                  ...currentTiers[index],
                                  name: e.target.value,
                                };
                                setEditingSprint({ ...editingSprint, tiers: currentTiers });
                              }}
                              placeholder="e.g. Standard, Pro, VIP"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Price (INR)</Label>
                            <Input
                              type="number"
                              value={tier.price}
                              onChange={(e) => {
                                const currentTiers = [...(editingSprint.tiers || [])];
                                currentTiers[index] = {
                                  ...currentTiers[index],
                                  price: Number(e.target.value),
                                };
                                setEditingSprint({ ...editingSprint, tiers: currentTiers });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Original Strikethrough Price (INR)</Label>
                            <Input
                              type="number"
                              value={tier.originalPrice || ""}
                              onChange={(e) => {
                                const currentTiers = [...(editingSprint.tiers || [])];
                                currentTiers[index] = {
                                  ...currentTiers[index],
                                  originalPrice: e.target.value ? Number(e.target.value) : null,
                                };
                                setEditingSprint({ ...editingSprint, tiers: currentTiers });
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Short Description</Label>
                          <Input
                            value={tier.description}
                            onChange={(e) => {
                              const currentTiers = [...(editingSprint.tiers || [])];
                              currentTiers[index] = {
                                ...currentTiers[index],
                                description: e.target.value,
                              };
                              setEditingSprint({ ...editingSprint, tiers: currentTiers });
                            }}
                            placeholder="e.g. Complete bundle with mentorship"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">What&apos;s Included (Comma-separated)</Label>
                          <Input
                            value={
                              Array.isArray(tier.whatIncluded)
                                ? tier.whatIncluded.join(", ")
                                : tier.whatIncluded
                            }
                            onChange={(e) => {
                              const currentTiers = [...(editingSprint.tiers || [])];
                              currentTiers[index] = {
                                ...currentTiers[index],
                                whatIncluded: e.target.value.split(",").map((s) => s.trim()),
                              };
                              setEditingSprint({ ...editingSprint, tiers: currentTiers });
                            }}
                            placeholder="All Live Sessions, Toolkit Content, Community Access"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <Switch
                            id={`tier-default-${index}`}
                            checked={tier.isDefault}
                            onCheckedChange={(val) => {
                              const currentTiers = [...(editingSprint.tiers || [])];
                              currentTiers.forEach((t, i) => (t.isDefault = i === index ? val : false));
                              setEditingSprint({ ...editingSprint, tiers: currentTiers });
                            }}
                          />
                          <Label htmlFor={`tier-default-${index}`} className="text-xs">
                            Default Selected Plan
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* curriculum Tab */}
            {activeEditTab === "curriculum" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-md font-semibold">Sprint Curriculum Sessions</h3>
                    <p className="text-xs text-gray-500">
                      Configure live session links, recordings, mentors, and resources.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setManagingSprint(editingSprint);
                      setSessionManagerOpen(true);
                    }}
                    className="bg-[#ff5e14] hover:bg-[#e04f0f] text-white text-xs"
                    size="sm"
                  >
                    <FolderCog className="w-3.5 h-3.5 mr-1" /> Open Session Manager
                  </Button>
                </div>

                <div className="border rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">
                    {editingSprint.sessions?.length || 0} Sessions Configured
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Use the full Session Manager tool to customize lessons, video recordings, mentor assignments, and section attachments.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setManagingSprint(editingSprint);
                      setSessionManagerOpen(true);
                    }}
                    className="text-xs border-gray-300"
                  >
                    Manage Sessions &amp; Curriculum Content
                  </Button>
                </div>
              </div>
            )}

            {/* faqs Tab */}
            {activeEditTab === "faqs" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-md font-semibold">Frequently Asked Questions</h3>
                    <p className="text-xs text-gray-500">
                      Manage FAQs displayed on the sprint details page.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setManagingSprint(editingSprint);
                      setFaqManagerOpen(true);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                    size="sm"
                  >
                    <HelpCircle className="w-3.5 h-3.5 mr-1" /> Open FAQ Manager
                  </Button>
                </div>

                <div className="border rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">
                    {editingSprint.faqs?.length || 0} FAQs Configured
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Click below to add, edit, or reorder questions and answers for this sprint.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setManagingSprint(editingSprint);
                      setFaqManagerOpen(true);
                    }}
                    className="text-xs border-gray-300"
                  >
                    Manage FAQs
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveSprint}
                disabled={isLoading}
                className="bg-[#ff5e14] hover:bg-[#e04f0f] text-white"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Linked Managers Modals */}
      {sessionManagerOpen && managingSprint && (
        <SprintSessionManager
          sprintId={managingSprint.id}
          sprintTitle={managingSprint.title}
          open={sessionManagerOpen}
          onClose={() => {
            setSessionManagerOpen(false);
            fetchSprints();
          }}
          onUpdate={fetchSprints}
        />
      )}

      {upgradePlansOpen && managingSprint && (
        <SprintUpgradePlansManager
          sprintId={managingSprint.id}
          sprintTitle={managingSprint.title}
          open={upgradePlansOpen}
          onClose={() => {
            setUpgradePlansOpen(false);
            fetchSprints();
          }}
          onUpdate={fetchSprints}
        />
      )}

      {mentorManagerOpen && managingSprint && (
        <SprintMentorManager
          sprintId={managingSprint.id}
          sprintTitle={managingSprint.title}
          open={mentorManagerOpen}
          onClose={() => {
            setMentorManagerOpen(false);
            fetchSprints();
          }}
          onUpdate={fetchSprints}
        />
      )}

      {faqManagerOpen && managingSprint && (
        <SprintFaqManager
          sprintId={managingSprint.id}
          sprintTitle={managingSprint.title}
          open={faqManagerOpen}
          onClose={() => {
            setFaqManagerOpen(false);
            fetchSprints();
          }}
          onUpdate={fetchSprints}
        />
      )}

      {managePackagesModalState.open && (
        <ManageUserSprintPackagesModal
          open={managePackagesModalState.open}
          onClose={() =>
            setManagePackagesModalState((prev) => ({ ...prev, open: false }))
          }
          sprintId={managePackagesModalState.sprintId}
          userId={managePackagesModalState.userId}
          userName={managePackagesModalState.userName}
          userEmail={managePackagesModalState.userEmail}
          userTierName={managePackagesModalState.userTierName}
          isBundleUser={managePackagesModalState.isBundleUser}
        />
      )}
    </div>
  );
}
