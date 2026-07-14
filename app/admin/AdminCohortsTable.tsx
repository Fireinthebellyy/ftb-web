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
  Image as ImageIcon,
  X,
  ArrowUp,
  ArrowDown,
  Download,
  FolderCog,
  Gift,
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
import CohortSessionManager from "./CohortSessionManager";

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
}

interface Cohort {
  id: string;
  title: string;
  slug: string;
  badge1: string;
  badge2: string;
  subtitle: string;
  coverImageUrl: string;
  coverImageUrls?: string[] | null;
  cardImageUrl?: string | null;
  startDate?: string | null;
  highlights?: string[] | null;
  mentorsHeading: string;
  mentorsLinkTarget: string;
  mentorsLimit: number;
  featuresHeading: string;
  sessionsHeading?: string | null;
  testimonialsHeading?: string | null;
  whoIsThisForHeading?: string | null;
  whoIsThisForBullets?: string[] | null;
  investmentLabel: string;
  basePrice: number;
  originalPrice?: number | null;
  toolkitId?: string | null;
  isActive: boolean;
  isBestSeller?: boolean | null;
  isFillingFast?: boolean | null;
  hasEarlyBird?: boolean | null;
  showEarlyBirdCheckout?: boolean | null;
  showAddonsCheckout?: boolean | null;
  mentors?: Mentor[];
  features?: Feature[];
  tiers?: Tier[];
  addons?: Addon[];
  sessions?: Session[];
}

interface Order {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  buddyEmail?: string | null;
  amountPaid: number;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: string;
  createdAt: string;
  cohortTitle: string | null;
  tierName: string | null;
}

export default function AdminCohortsTable() {
  const [view, setView] = useState<"cohorts" | "orders">("cohorts");
  const [cohortsList, setCohortsList] = useState<Cohort[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cohort creation state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCohortTitle, setNewCohortTitle] = useState("");
  const [newCohortSlug, setNewCohortSlug] = useState("");
  const [newCohortPrice, setNewCohortPrice] = useState(4999);

  // Cohort editing state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<"details" | "mentors" | "features" | "pricing" | "curriculum">("details");

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [toolkits, setToolkits] = useState<any[]>([]);

  // Session manager state
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
  const [managingCohort, setManagingCohort] = useState<Cohort | null>(null);

  // Load Initial Data
  useEffect(() => {
    fetchCohorts();
    fetchOrders();
    fetchToolkits();
  }, []);

  const fetchToolkits = async () => {
    try {
      const response = await axios.get("/api/admin/toolkits");
      setToolkits(response.data);
    } catch (err) {
      console.error("Failed to load toolkits list:", err);
    }
  };

  const fetchCohorts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/cohorts");
      setCohortsList(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cohorts");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/admin/cohorts/orders");
      setOrdersList(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders log");
    }
  };

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortTitle || !newCohortSlug) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await axios.post("/api/admin/cohorts", {
        title: newCohortTitle,
        slug: newCohortSlug,
        basePrice: newCohortPrice,
      });
      toast.success("Cohort created successfully!");
      setCreateDialogOpen(false);
      setNewCohortTitle("");
      setNewCohortSlug("");
      setNewCohortPrice(4999);
      fetchCohorts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create cohort");
    }
  };

  const startEditCohort = async (cohortId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/cohorts/${cohortId}`);
      const data = response.data;
      const urls = data.coverImageUrls || [];
      const coverImageUrls = [
        urls[0] || data.coverImageUrl || "",
        urls[1] || "",
        urls[2] || ""
      ];
      setEditingCohort({
        ...data,
        coverImageUrls,
        sessionsHeading: data.sessionsHeading || "Cohort Sessions & Curriculum",
        testimonialsHeading: data.testimonialsHeading || "What Members Say About Our Ecosystem"
      });
      setActiveEditTab("details");
      setEditDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cohort details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCohort = async () => {
    if (!editingCohort) return;
    setIsLoading(true);
    try {
      await axios.put(`/api/admin/cohorts/${editingCohort.id}`, editingCohort);
      toast.success("Cohort saved successfully!");
      setEditDialogOpen(false);
      fetchCohorts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save cohort");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCohort = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cohort? This cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/cohorts/${id}`);
      toast.success("Cohort deleted");
      fetchCohorts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete cohort");
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

  // Export to CSV
  const exportToCSV = () => {
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
      "Cohort Title",
      "Selected Tier",
      "Amount Paid (INR)",
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
      order.cohortTitle || "",
      order.tierName || "",
      (order.amountPaid / 100).toFixed(2),
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
    link.setAttribute("download", `cohort_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Switcher */}
      <div className="flex border-b">
        <button
          onClick={() => setView("cohorts")}
          className={`px-4 py-2 font-medium border-b-2 text-sm transition-all ${
            view === "cohorts"
              ? "border-[#ff5e14] text-[#ff5e14]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Cohorts List
        </button>
        <button
          onClick={() => setView("orders")}
          className={`px-4 py-2 font-medium border-b-2 text-sm transition-all ${
            view === "orders"
              ? "border-[#ff5e14] text-[#ff5e14]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Orders & Applications Log
        </button>
      </div>

      {view === "cohorts" ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Programs</h2>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-[#ff5e14] hover:bg-[#e04f0f] text-white flex gap-1.5 items-center"
            >
              <Plus className="w-4 h-4" /> Create Cohort
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#ff5e14]" />
            </div>
          ) : cohortsList.length === 0 ? (
            <div className="border bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">No cohorts built yet.</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="outline"
                className="border-[#ff5e14] text-[#ff5e14] hover:bg-orange-50"
              >
                Create your first cohort
              </Button>
            </div>
          ) : (
            <div className="border bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 font-semibold text-gray-700">Cohort Title</th>
                    <th className="p-4 font-semibold text-gray-700">Slug (URL)</th>
                    <th className="p-4 font-semibold text-gray-700">Base Price</th>
                    <th className="p-4 font-semibold text-gray-700">Status</th>
                    <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cohortsList.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{c.title}</td>
                      <td className="p-4 text-gray-500">/toolkit/cohorts/{c.slug}</td>
                      <td className="p-4 font-semibold text-gray-900">₹{c.basePrice}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            c.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {c.isActive ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setManagingCohort(c);
                            setSessionManagerOpen(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FolderCog className="w-4 h-4 mr-1" /> Sessions
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditCohort(c.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCohort(c.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Orders Log</h2>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="flex gap-1.5 items-center border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>

          {ordersList.length === 0 ? (
            <div className="border bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500">No applications or purchases recorded yet.</p>
            </div>
          ) : (
            <div className="border bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 font-semibold text-gray-700">Buyer</th>
                    <th className="p-4 font-semibold text-gray-700">Buddy (Referral)</th>
                    <th className="p-4 font-semibold text-gray-700">Cohort & Tier</th>
                    <th className="p-4 font-semibold text-gray-700">Paid</th>
                    <th className="p-4 font-semibold text-gray-700">Razorpay Info</th>
                    <th className="p-4 font-semibold text-gray-700">Status</th>
                    <th className="p-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ordersList.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{order.buyerName}</div>
                        <div className="text-xs text-gray-500">{order.buyerEmail}</div>
                        {order.buyerPhone && <div className="text-xs text-gray-400">{order.buyerPhone}</div>}
                      </td>
                      <td className="p-4">
                        {order.buddyEmail ? (
                          <div>
                            <span className="inline-flex items-center gap-1 bg-orange-50 text-[#ff5e14] px-2 py-0.5 text-[10px] font-bold rounded-full border border-orange-100 mb-1">
                              <Gift className="w-3 h-3" /> Buddy Added
                            </span>
                            <div className="text-xs text-gray-600 font-medium select-all">{order.buddyEmail}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-normal italic">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-950">{order.cohortTitle || "Unknown"}</div>
                        <div className="text-xs text-[#ff5e14]">{order.tierName || "Base price"}</div>
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        ₹{(order.amountPaid / 100).toFixed(2)}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        <div>Order: {order.razorpayOrderId}</div>
                        {order.razorpayPaymentId && (
                          <div className="text-emerald-700 font-medium">Pay ID: {order.razorpayPaymentId}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cohort Creation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Cohort Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCohort} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Program Title</Label>
              <Input
                id="title"
                placeholder="e.g. Ivy League Hustle Cohort"
                value={newCohortTitle}
                onChange={(e) => {
                  setNewCohortTitle(e.target.value);
                  // Auto-generate slug
                  setNewCohortSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Custom URL Slug</Label>
              <Input
                id="slug"
                placeholder="e.g. ivy-league-hustle"
                value={newCohortSlug}
                onChange={(e) => setNewCohortSlug(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Base Price (INR)</Label>
              <Input
                id="price"
                type="number"
                value={newCohortPrice}
                onChange={(e) => setNewCohortPrice(Number(e.target.value))}
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

      {/* Cohort Editing Sheet / Dialog */}
      {editingCohort && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader className="flex flex-row justify-between items-center border-b pb-4 mb-4">
              <div>
                <DialogTitle className="text-xl">Configure Program: {editingCohort.title}</DialogTitle>
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
                Page Details & Hero
              </button>
              <button
                onClick={() => setActiveEditTab("mentors")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "mentors"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Mentors ({editingCohort.mentors?.length || 0})
              </button>
              <button
                onClick={() => setActiveEditTab("features")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "features"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                What You Get ({editingCohort.features?.length || 0})
              </button>
              <button
                onClick={() => setActiveEditTab("pricing")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "pricing"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Pricing, Tiers & Add-ons
              </button>
              <button
                onClick={() => setActiveEditTab("curriculum")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeEditTab === "curriculum"
                    ? "bg-[#ff5e14] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Curriculum ({editingCohort.sessions?.length || 0})
              </button>
            </div>

            {/* details Tab */}
            {activeEditTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={editingCohort.title}
                      onChange={(e) => setEditingCohort({ ...editingCohort, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slug</Label>
                    <Input
                      value={editingCohort.slug}
                      onChange={(e) => setEditingCohort({ ...editingCohort, slug: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description / Subtitle</Label>
                    <Textarea
                      rows={3}
                      value={editingCohort.subtitle}
                      onChange={(e) => setEditingCohort({ ...editingCohort, subtitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Linked Content Toolkit</Label>
                    <select
                      value={editingCohort.toolkitId || ""}
                      onChange={(e) => setEditingCohort({ ...editingCohort, toolkitId: e.target.value || null })}
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
                    <Label>Cohort Start Date / Dates</Label>
                    <Input
                      value={editingCohort.startDate || ""}
                      onChange={(e) => setEditingCohort({ ...editingCohort, startDate: e.target.value })}
                      placeholder="e.g. Starts 15th July • 8 Weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Card Highlights / Key Features</Label>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {(editingCohort.highlights || []).map((highlight, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            value={highlight}
                            onChange={(e) => {
                              const newHighlights = [...(editingCohort.highlights || [])];
                              newHighlights[idx] = e.target.value;
                              setEditingCohort({ ...editingCohort, highlights: newHighlights });
                            }}
                            placeholder={`Feature #${idx + 1}`}
                            className="flex-1 text-sm h-8"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newHighlights = (editingCohort.highlights || []).filter((_, i) => i !== idx);
                              setEditingCohort({ ...editingCohort, highlights: newHighlights });
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
                        const newHighlights = [...(editingCohort.highlights || []), ""];
                        setEditingCohort({ ...editingCohort, highlights: newHighlights });
                      }}
                      className="text-xs font-bold text-[#ff5e14] hover:underline flex items-center gap-1.5 pt-1"
                    >
                      + Add Key Feature
                    </button>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs font-semibold">Who Is This For? - Section Heading</Label>
                    <Input
                      value={editingCohort.whoIsThisForHeading || ""}
                      onChange={(e) => setEditingCohort({ ...editingCohort, whoIsThisForHeading: e.target.value })}
                      placeholder="e.g. Who Is This For?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Who Is This For? - Bullet Points</Label>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {(editingCohort.whoIsThisForBullets || []).map((bullet, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            value={bullet}
                            onChange={(e) => {
                              const newBullets = [...(editingCohort.whoIsThisForBullets || [])];
                              newBullets[idx] = e.target.value;
                              setEditingCohort({ ...editingCohort, whoIsThisForBullets: newBullets });
                            }}
                            placeholder={`Point #${idx + 1}`}
                            className="flex-1 text-sm h-8"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newBullets = (editingCohort.whoIsThisForBullets || []).filter((_, i) => i !== idx);
                              setEditingCohort({ ...editingCohort, whoIsThisForBullets: newBullets });
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
                        const newBullets = [...(editingCohort.whoIsThisForBullets || []), ""];
                        setEditingCohort({ ...editingCohort, whoIsThisForBullets: newBullets });
                      }}
                      className="text-xs font-bold text-[#ff5e14] hover:underline flex items-center gap-1.5 pt-1"
                    >
                      + Add Target Audience Point
                    </button>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-4">
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-gray-800 block">Hero Banner Images (Max 3 for Carousel)</Label>
                    
                    {/* Banner 1 */}
                    <div className="border p-3 rounded-xl bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">1. Hero Banner Image (Primary)</span>
                        {editingCohort.coverImageUrl && (
                          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-150">Active</span>
                        )}
                      </div>
                      {editingCohort.coverImageUrl && (
                        <img
                          src={editingCohort.coverImageUrl}
                          alt="Primary banner preview"
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                      )}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Upload Image File</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) => {
                                  const urls = [...(editingCohort.coverImageUrls || [])];
                                  urls[0] = url;
                                  setEditingCohort({
                                    ...editingCohort,
                                    coverImageUrl: url,
                                    coverImageUrls: urls
                                  });
                                });
                              }
                            }}
                          />
                          {isUploading && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Or Image URL</Label>
                        <Input
                          value={editingCohort.coverImageUrl || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const urls = [...(editingCohort.coverImageUrls || [])];
                            urls[0] = val;
                            setEditingCohort({
                              ...editingCohort,
                              coverImageUrl: val,
                              coverImageUrls: urls
                            });
                          }}
                          placeholder="https://example.com/banner-primary.jpg"
                        />
                      </div>
                    </div>

                    {/* Banner 2 */}
                    <div className="border p-3 rounded-xl bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">2. Hero Banner Image 2 (Optional)</span>
                        {editingCohort.coverImageUrls?.[1] && (
                          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-150">Active</span>
                        )}
                      </div>
                      {editingCohort.coverImageUrls?.[1] && (
                        <img
                          src={editingCohort.coverImageUrls[1]}
                          alt="Banner 2 preview"
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                      )}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Upload Image File</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) => {
                                  const urls = [...(editingCohort.coverImageUrls || [])];
                                  urls[1] = url;
                                  setEditingCohort({
                                    ...editingCohort,
                                    coverImageUrls: urls
                                  });
                                });
                              }
                            }}
                          />
                          {isUploading && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Or Image URL</Label>
                        <Input
                          value={editingCohort.coverImageUrls?.[1] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const urls = [...(editingCohort.coverImageUrls || [])];
                            urls[1] = val;
                            setEditingCohort({
                              ...editingCohort,
                              coverImageUrls: urls
                            });
                          }}
                          placeholder="https://example.com/banner-2.jpg"
                        />
                      </div>
                    </div>

                    {/* Banner 3 */}
                    <div className="border p-3 rounded-xl bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">3. Hero Banner Image 3 (Optional)</span>
                        {editingCohort.coverImageUrls?.[2] && (
                          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-150">Active</span>
                        )}
                      </div>
                      {editingCohort.coverImageUrls?.[2] && (
                        <img
                          src={editingCohort.coverImageUrls[2]}
                          alt="Banner 3 preview"
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                      )}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Upload Image File</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) => {
                                  const urls = [...(editingCohort.coverImageUrls || [])];
                                  urls[2] = url;
                                  setEditingCohort({
                                    ...editingCohort,
                                    coverImageUrls: urls
                                  });
                                });
                              }
                            }}
                          />
                          {isUploading && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Or Image URL</Label>
                        <Input
                          value={editingCohort.coverImageUrls?.[2] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const urls = [...(editingCohort.coverImageUrls || [])];
                            urls[2] = val;
                            setEditingCohort({
                              ...editingCohort,
                              coverImageUrls: urls
                            });
                          }}
                          placeholder="https://example.com/banner-3.jpg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Card Cover Image (Optional - fallback to Hero)</Label>
                    {editingCohort.cardImageUrl && (
                      <img
                        src={editingCohort.cardImageUrl}
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
                              setEditingCohort({ ...editingCohort, cardImageUrl: url })
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
                      value={editingCohort.mentorsHeading}
                      onChange={(e) => setEditingCohort({ ...editingCohort, mentorsHeading: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Mentors Show Limit</Label>
                      <Input
                        type="number"
                        value={editingCohort.mentorsLimit}
                        onChange={(e) => setEditingCohort({ ...editingCohort, mentorsLimit: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mentors View All Link</Label>
                      <Input
                        value={editingCohort.mentorsLinkTarget || ""}
                        onChange={(e) => setEditingCohort({ ...editingCohort, mentorsLinkTarget: e.target.value })}
                        placeholder="/mentors or #all"
                      />
                    </div>
                  </div>

                   <div className="space-y-1.5">
                    <Label>Features Section Heading</Label>
                    <Input
                      value={editingCohort.featuresHeading}
                      onChange={(e) => setEditingCohort({ ...editingCohort, featuresHeading: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Curriculum / Sessions Section Heading</Label>
                    <Input
                      value={editingCohort.sessionsHeading || ""}
                      onChange={(e) => setEditingCohort({ ...editingCohort, sessionsHeading: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Testimonials Section Heading</Label>
                    <Input
                      value={editingCohort.testimonialsHeading || ""}
                      onChange={(e) => setEditingCohort({ ...editingCohort, testimonialsHeading: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="cohort-active"
                        checked={editingCohort.isActive}
                        onCheckedChange={(val) => setEditingCohort({ ...editingCohort, isActive: val })}
                      />
                      <Label htmlFor="cohort-active">Active (Visible to public)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="cohort-best-seller"
                        checked={!!editingCohort.isBestSeller}
                        onCheckedChange={(val) => setEditingCohort({ ...editingCohort, isBestSeller: val })}
                      />
                      <Label htmlFor="cohort-best-seller">Best Seller Tag</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="cohort-filling-fast"
                        checked={!!editingCohort.isFillingFast}
                        onCheckedChange={(val) => setEditingCohort({ ...editingCohort, isFillingFast: val })}
                      />
                      <Label htmlFor="cohort-filling-fast">Filling Fast Tag</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* mentors Tab */}
            {activeEditTab === "mentors" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-semibold">Cohort Mentors</h3>
                  <Button
                    onClick={() => {
                      const currentMentors = editingCohort.mentors || [];
                      setEditingCohort({
                        ...editingCohort,
                        mentors: [
                          ...currentMentors,
                          { name: "", role: "", imageUrl: "", bio: "", link: "" },
                        ],
                      });
                    }}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border text-xs"
                    size="sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Mentor Card
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(editingCohort.mentors || []).map((mentor, index) => (
                    <div key={index} className="border p-4 rounded-lg bg-gray-50 flex flex-col md:flex-row gap-4 relative">
                      <button
                        onClick={() => {
                          const currentMentors = [...(editingCohort.mentors || [])];
                          currentMentors.splice(index, 1);
                          setEditingCohort({ ...editingCohort, mentors: currentMentors });
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex flex-col items-center gap-2">
                        {mentor.imageUrl ? (
                          <img
                            src={mentor.imageUrl}
                            alt="Mentor preview"
                            className="w-16 h-16 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="w-28 text-xs cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (url) => {
                                const currentMentors = [...(editingCohort.mentors || [])];
                                currentMentors[index] = { ...currentMentors[index], imageUrl: url };
                                setEditingCohort({ ...editingCohort, mentors: currentMentors });
                              });
                            }
                          }}
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Mentor Name</Label>
                          <Input
                            value={mentor.name}
                            onChange={(e) => {
                              const currentMentors = [...(editingCohort.mentors || [])];
                              currentMentors[index] = { ...currentMentors[index], name: e.target.value };
                              setEditingCohort({ ...editingCohort, mentors: currentMentors });
                            }}
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Title / Role</Label>
                          <Input
                            value={mentor.role}
                            onChange={(e) => {
                              const currentMentors = [...(editingCohort.mentors || [])];
                              currentMentors[index] = { ...currentMentors[index], role: e.target.value };
                              setEditingCohort({ ...editingCohort, mentors: currentMentors });
                            }}
                            placeholder="e.g. Ex-Google PM, Stanford Alum"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Linkedin URL</Label>
                          <Input
                            value={mentor.link || ""}
                            onChange={(e) => {
                              const currentMentors = [...(editingCohort.mentors || [])];
                              currentMentors[index] = { ...currentMentors[index], link: e.target.value };
                              setEditingCohort({ ...editingCohort, mentors: currentMentors });
                            }}
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Bio Details</Label>
                          <Input
                            value={mentor.bio || ""}
                            onChange={(e) => {
                              const currentMentors = [...(editingCohort.mentors || [])];
                              currentMentors[index] = { ...currentMentors[index], bio: e.target.value };
                              setEditingCohort({ ...editingCohort, mentors: currentMentors });
                            }}
                            placeholder="Short summary description"
                          />
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex md:flex-col justify-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => {
                            const currentMentors = [...(editingCohort.mentors || [])];
                            const temp = currentMentors[index];
                            currentMentors[index] = currentMentors[index - 1];
                            currentMentors[index - 1] = temp;
                            setEditingCohort({ ...editingCohort, mentors: currentMentors });
                          }}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === (editingCohort.mentors || []).length - 1}
                          onClick={() => {
                            const currentMentors = [...(editingCohort.mentors || [])];
                            const temp = currentMentors[index];
                            currentMentors[index] = currentMentors[index + 1];
                            currentMentors[index + 1] = temp;
                            setEditingCohort({ ...editingCohort, mentors: currentMentors });
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

            {/* features Tab */}
            {activeEditTab === "features" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-semibold">&quot;What You Get&quot; Features Rows</h3>
                  <Button
                    onClick={() => {
                      const currentFeatures = editingCohort.features || [];
                      setEditingCohort({
                        ...editingCohort,
                        features: [
                          ...currentFeatures,
                          { icon: "Check", title: "", description: "" },
                        ],
                      });
                    }}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border text-xs"
                    size="sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Feature Row
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(editingCohort.features || []).map((feature, index) => (
                    <div key={index} className="border p-4 rounded-lg bg-gray-50 flex gap-3 relative items-start">
                      <button
                        onClick={() => {
                          const currentFeatures = [...(editingCohort.features || [])];
                          currentFeatures.splice(index, 1);
                          setEditingCohort({ ...editingCohort, features: currentFeatures });
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-1 w-24">
                        <Label className="text-xs">Icon Name</Label>
                        <Input
                          value={feature.icon}
                          onChange={(e) => {
                            const currentFeatures = [...(editingCohort.features || [])];
                            currentFeatures[index] = { ...currentFeatures[index], icon: e.target.value };
                            setEditingCohort({ ...editingCohort, features: currentFeatures });
                          }}
                          placeholder="e.g. Check"
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Feature Title</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) => {
                              const currentFeatures = [...(editingCohort.features || [])];
                              currentFeatures[index] = { ...currentFeatures[index], title: e.target.value };
                              setEditingCohort({ ...editingCohort, features: currentFeatures });
                            }}
                            placeholder="e.g. 10+ Live Templates"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Feature Description</Label>
                          <Input
                            value={feature.description}
                            onChange={(e) => {
                              const currentFeatures = [...(editingCohort.features || [])];
                              currentFeatures[index] = { ...currentFeatures[index], description: e.target.value };
                              setEditingCohort({ ...editingCohort, features: currentFeatures });
                            }}
                            placeholder="Brief detail explaining the benefit"
                          />
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-1 self-center">
                        <button
                          disabled={index === 0}
                          onClick={() => {
                            const currentFeatures = [...(editingCohort.features || [])];
                            const temp = currentFeatures[index];
                            currentFeatures[index] = currentFeatures[index - 1];
                            currentFeatures[index - 1] = temp;
                            setEditingCohort({ ...editingCohort, features: currentFeatures });
                          }}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === (editingCohort.features || []).length - 1}
                          onClick={() => {
                            const currentFeatures = [...(editingCohort.features || [])];
                            const temp = currentFeatures[index];
                            currentFeatures[index] = currentFeatures[index + 1];
                            currentFeatures[index + 1] = temp;
                            setEditingCohort({ ...editingCohort, features: currentFeatures });
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                  <div className="space-y-1.5">
                    <Label>Total Price Label</Label>
                    <Input
                      value={editingCohort.investmentLabel}
                      onChange={(e) => setEditingCohort({ ...editingCohort, investmentLabel: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cohort Base Price (INR)</Label>
                    <Input
                      type="number"
                      value={editingCohort.basePrice}
                      onChange={(e) => setEditingCohort({ ...editingCohort, basePrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cohort Original Price (INR, Optional)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 9999"
                      value={editingCohort.originalPrice || ""}
                      onChange={(e) => setEditingCohort({ ...editingCohort, originalPrice: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                </div>

                 {/* Early Bird Offer Toggle */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Enable Early Bird Offer Banner</Label>
                    <p className="text-xs text-gray-500">Toggles the scrolling &quot;Early Bird Offer!!&quot; marquee at the top of landing & checkout screens.</p>
                  </div>
                  <Switch
                    checked={Boolean(editingCohort.hasEarlyBird)}
                    onCheckedChange={(checked) => setEditingCohort({ ...editingCohort, hasEarlyBird: checked })}
                  />
                </div>

                {/* Early Bird Price on Checkout Toggle */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Show Early Bird Price on Checkout</Label>
                    <p className="text-xs text-gray-500">Displays total original price strikethroughed with an &quot;Early Bird offer&quot; bubble near payable price.</p>
                  </div>
                  <Switch
                    checked={Boolean(editingCohort.showEarlyBirdCheckout)}
                    onCheckedChange={(checked) => setEditingCohort({ ...editingCohort, showEarlyBirdCheckout: checked })}
                  />
                </div>

                {/* Optional Add-ons Section Toggle */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Enable Optional Add-ons in Checkout</Label>
                    <p className="text-xs text-gray-500">Toggles visibility of the Toolkit Add-ons/Optional Add-ons section on the checkout drawer.</p>
                  </div>
                  <Switch
                    checked={editingCohort.showAddonsCheckout !== false}
                    onCheckedChange={(checked) => setEditingCohort({ ...editingCohort, showAddonsCheckout: checked })}
                  />
                </div>
                {/* Tiers / Bundles */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-sm">Offer Tiers (Upsell Bundles)</h4>
                      <p className="text-xs text-gray-500">Show packages shown upon clicking &apos;Apply Now&apos;</p>
                    </div>
                    <Button
                      onClick={() => {
                        const currentTiers = editingCohort.tiers || [];
                        setEditingCohort({
                          ...editingCohort,
                          tiers: [
                            ...currentTiers,
                            { name: "", price: 4999, originalPrice: null, description: "", whatIncluded: [], isDefault: false },
                          ],
                        });
                      }}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border text-xs"
                      size="sm"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Tier
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {(editingCohort.tiers || []).map((tier, index) => (
                      <div key={index} className="border p-4 rounded-lg bg-gray-50 flex flex-col gap-3 relative">
                        <button
                          onClick={() => {
                            const currentTiers = [...(editingCohort.tiers || [])];
                            currentTiers.splice(index, 1);
                            setEditingCohort({ ...editingCohort, tiers: currentTiers });
                          }}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Tier Name</Label>
                            <Input
                              value={tier.name}
                              onChange={(e) => {
                                const currentTiers = [...(editingCohort.tiers || [])];
                                currentTiers[index] = { ...currentTiers[index], name: e.target.value };
                                setEditingCohort({ ...editingCohort, tiers: currentTiers });
                              }}
                              placeholder="e.g. VIP Mentorship Bundle"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Price (INR)</Label>
                            <Input
                              type="number"
                              value={tier.price}
                              onChange={(e) => {
                                const currentTiers = [...(editingCohort.tiers || [])];
                                currentTiers[index] = { ...currentTiers[index], price: Number(e.target.value) };
                                setEditingCohort({ ...editingCohort, tiers: currentTiers });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Original Price (Optional)</Label>
                            <Input
                              type="number"
                              placeholder="Strikethrough price"
                              value={tier.originalPrice || ""}
                              onChange={(e) => {
                                const currentTiers = [...(editingCohort.tiers || [])];
                                currentTiers[index] = { ...currentTiers[index], originalPrice: e.target.value ? Number(e.target.value) : null };
                                setEditingCohort({ ...editingCohort, tiers: currentTiers });
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-5">
                            <input
                              id={`tier-default-${index}`}
                              type="checkbox"
                              checked={tier.isDefault}
                              onChange={(e) => {
                                const currentTiers = (editingCohort.tiers || []).map((t, idx) => ({
                                  ...t,
                                  isDefault: idx === index ? e.target.checked : false,
                                }));
                                setEditingCohort({ ...editingCohort, tiers: currentTiers });
                              }}
                              className="rounded border-gray-300 text-[#ff5e14] focus:ring-[#ff5e14] h-4 w-4"
                            />
                            <Label htmlFor={`tier-default-${index}`} className="text-xs cursor-pointer">
                              Pre-selected Default
                            </Label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={tier.description}
                              onChange={(e) => {
                                const currentTiers = [...(editingCohort.tiers || [])];
                                currentTiers[index] = { ...currentTiers[index], description: e.target.value };
                                setEditingCohort({ ...editingCohort, tiers: currentTiers });
                              }}
                              placeholder="e.g. Cohort plus weekly 1:1 sessions"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">What&apos;s Included (comma separated)</Label>
                            <Input
                              value={
                                Array.isArray(tier.whatIncluded)
                                  ? tier.whatIncluded.join(", ")
                                  : (tier.whatIncluded as string) || ""
                              }
                              onChange={(e) => {
                                const currentTiers = [...(editingCohort.tiers || [])];
                                currentTiers[index] = { ...currentTiers[index], whatIncluded: e.target.value };
                                setEditingCohort({ ...editingCohort, tiers: currentTiers });
                              }}
                              placeholder="1:1 review, Certificate, Resume templates"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeEditTab === "curriculum" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-md font-semibold">Cohort Sessions & Curriculum</h3>
                    <p className="text-xs text-gray-500">Add sessions to outline what is covered week-by-week</p>
                  </div>
                  <Button
                    onClick={() => {
                      const currentSessions = editingCohort.sessions || [];
                      setEditingCohort({
                        ...editingCohort,
                        sessions: [
                          ...currentSessions,
                          { title: "", description: "", price: 0, originalPrice: null },
                        ],
                      });
                    }}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border text-xs"
                    size="sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Session
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(editingCohort.sessions || []).map((session, index) => (
                    <div key={index} className="border p-4 rounded-lg bg-gray-50 flex gap-3 relative items-start">
                      <button
                        onClick={() => {
                          const currentSessions = [...(editingCohort.sessions || [])];
                          currentSessions.splice(index, 1);
                          setEditingCohort({ ...editingCohort, sessions: currentSessions });
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Session Title</Label>
                          <Input
                            value={session.title}
                            onChange={(e) => {
                              const currentSessions = [...(editingCohort.sessions || [])];
                              currentSessions[index] = { ...currentSessions[index], title: e.target.value };
                              setEditingCohort({ ...editingCohort, sessions: currentSessions });
                            }}
                            placeholder="e.g. Session 1: Resume Deep-dive"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Session Description</Label>
                          <Input
                            value={session.description}
                            onChange={(e) => {
                              const currentSessions = [...(editingCohort.sessions || [])];
                              currentSessions[index] = { ...currentSessions[index], description: e.target.value };
                              setEditingCohort({ ...editingCohort, sessions: currentSessions });
                            }}
                            placeholder="Brief detail explaining the session agenda"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Offer Price (INR, Optional)</Label>
                          <Input
                            type="number"
                            value={session.price || ""}
                            onChange={(e) => {
                              const currentSessions = [...(editingCohort.sessions || [])];
                              currentSessions[index] = { ...currentSessions[index], price: e.target.value ? Number(e.target.value) : 0 };
                              setEditingCohort({ ...editingCohort, sessions: currentSessions });
                            }}
                            placeholder="Offer price when sold individually"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Original Price (INR, Optional)</Label>
                          <Input
                            type="number"
                            value={session.originalPrice || ""}
                            onChange={(e) => {
                              const currentSessions = [...(editingCohort.sessions || [])];
                              currentSessions[index] = { ...currentSessions[index], originalPrice: e.target.value ? Number(e.target.value) : null };
                              setEditingCohort({ ...editingCohort, sessions: currentSessions });
                            }}
                            placeholder="Strikethrough price"
                          />
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-1 self-center">
                        <button
                          disabled={index === 0}
                          onClick={() => {
                            const currentSessions = [...(editingCohort.sessions || [])];
                            const temp = currentSessions[index];
                            currentSessions[index] = currentSessions[index - 1];
                            currentSessions[index - 1] = temp;
                            setEditingCohort({ ...editingCohort, sessions: currentSessions });
                          }}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === (editingCohort.sessions || []).length - 1}
                          onClick={() => {
                            const currentSessions = [...(editingCohort.sessions || [])];
                            const temp = currentSessions[index];
                            currentSessions[index] = currentSessions[index + 1];
                            currentSessions[index + 1] = temp;
                            setEditingCohort({ ...editingCohort, sessions: currentSessions });
                          }}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(editingCohort.sessions || []).length === 0 && (
                    <div className="text-center py-6 text-sm text-gray-500 border border-dashed rounded-lg">
                      No sessions added yet. Click &quot;Add Session&quot; above to create one.
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="border-t pt-4 mt-6 gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveCohort}
                disabled={isLoading}
                className="bg-[#ff5e14] hover:bg-[#e04f0f] text-white flex gap-1.5 items-center"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {managingCohort ? (
        <CohortSessionManager
          cohortId={managingCohort.id}
          cohortTitle={managingCohort.title}
          open={sessionManagerOpen}
          onClose={() => setSessionManagerOpen(false)}
          onUpdate={() => fetchCohorts()}
        />
      ) : null}
    </div>
  );
}
