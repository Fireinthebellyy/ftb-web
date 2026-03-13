"use client";

import React, { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Briefcase,
  Building,
  GraduationCap,
  MapPin,
  IndianRupee,
  Share2,
  Sparkles,
  Bookmark,
  Calendar,
  Info,
  CalendarPlus,
  CalendarDays,
  Lightbulb,
  Flag,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import posthog from "posthog-js";
import { cn, toTitleCase } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ShareDialog } from "@/components/internship/ShareDialog";
import { useSession } from "@/hooks/use-session";
import { type InternshipData } from "@/types/interfaces";
import { mapInternshipToApplyOpportunity } from "@/lib/internship-utils";
import ApplyModal from "@/components/tracker/ApplyModal";
import { useTracker } from "@/components/providers/TrackerProvider";


export default function InternshipDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<InternshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [smartApplyOpen, setSmartApplyOpen] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const { data: session } = useSession();
  const { addToTracker, getStatus, removeFromTracker } = useTracker();

  const isBookmarked = !!getStatus(id || "", "internship");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/internships/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setNotFoundError(true);
          setLoading(false);
          return;
        }

        setInternship(data.internship as InternshipData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching internship:", error);
        setNotFoundError(true);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (notFoundError) {
    notFound();
  }

  // Formatting helpers
  const formatSalary = (stipend: number | null | undefined) => {
    if (!stipend) return "Unpaid / Not disclosed";
    return `${stipend.toLocaleString()} / mo`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const publicBaseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = publicBaseUrl
    ? `${publicBaseUrl}/intern/${id}`
    : `/intern/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      posthog.capture("internship_shared", {
        internship_id: id,
        title: internship?.title,
        method: "copy",
      });
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (method: string) => {
    posthog.capture("internship_shared", {
      internship_id: id,
      title: internship?.title,
      method,
    });
  };

  const handleBookmarkClick = async () => {
    if (!id || !internship) return;
    try {
      if (isBookmarked) {
        await removeFromTracker(id, "internship");
      } else {
        await addToTracker(id, "Not Applied", "internship");
      }
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleCalendarClick = () => {
    if (!internship) return;
    const date = internship.deadline
      ? new Date(internship.deadline)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const formatted = date.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Apply to: ${internship.title}`)}&dates=${formatted}/${formatted}&details=${encodeURIComponent(`Company: ${internship.hiringOrganization || "N/A"}\n\nInternship Link: ${shareUrl}`)}`;
    window.open(calendarUrl, "_blank");
  };

  const handleOpenChat = () => {
    const link = `https://wa.me/917014885565?text=${encodeURIComponent(
      `Type: Internship Help\nSource: /intern/${id}\n\nI need help with: ${internship?.title} at ${internship?.hiringOrganization}`
    )}`;
    window.open(link, "_blank");
  };

  const handleShareDialogOpenChange = (open: boolean) => {
    setShareDialogOpen(open);
  };

  const onSmartApplyClick = () => {
    setSmartApplyOpen(true);
  };

  if (loading || !internship) {
    return (
      <div className="flex min-h-[80vh] w-full flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ec5b13]"></div>
      </div>
    );
  }

  // Formatting helpers (comment kept for readability)
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans md:bg-[#f8f9fa]">

      {/* ============================================================
          MOBILE LAYOUT (hidden on md+)
      ============================================================ */}
      <div className="md:hidden pb-32">
        {/* Mobile Sticky Header */}
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <span className="font-bold text-[16px] text-slate-900">Internship Detail</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCalendarClick}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Calendar className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={() => setShareDialogOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={handleBookmarkClick}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isBookmarked ? "text-orange-500 bg-orange-50" : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
            </button>
          </div>
        </header>

        {/* Mobile Hero Section */}
        <div className="bg-white px-6 pt-10 pb-0">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Logo */}
            <div className="w-20 h-20 bg-orange-50 rounded-[24px] flex items-center justify-center border border-orange-100 shadow-sm overflow-hidden">
              {internship.poster ? (
                <Image src={internship.poster} alt={internship.hiringOrganization} width={80} height={80} className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-2xl font-bold text-[#ec5b13]">
                  {internship.hiringOrganization.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="w-full">
              <h1 className="text-[24px] font-extrabold text-[#1a1a1a] mb-1 leading-tight tracking-tight">
                {toTitleCase(internship.title)}
              </h1>
              <h2 className="text-[16px] font-bold text-[#ec5b13] mb-4">
                {toTitleCase(internship.hiringOrganization)}
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-x-2 text-[13px] text-slate-500 font-medium mb-5">
                {internship.location && (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{toTitleCase(internship.location)}</span>
                    <span className="mx-1">•</span>
                  </>
                )}
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <span>Posted {internship.createdAt ? formatDistanceToNow(new Date(internship.createdAt), { addSuffix: true }) : "recently"}</span>
              </div>

              <div className="flex flex-wrap justify-center gap-2.5">
                {internship.type && (
                  <Badge className="bg-orange-50 text-[#ec5b13] hover:bg-orange-100 border-none rounded-2xl px-4 py-2 font-bold text-[12px] flex items-center gap-1.5 shadow-sm">
                    <Briefcase className="w-3.5 h-3.5" />
                    {internship.type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                )}
                {internship.timing && (
                  <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none rounded-2xl px-4 py-2 font-bold text-[12px] flex items-center gap-1.5 shadow-sm">
                    <Building className="w-3.5 h-3.5" />
                    {internship.timing.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                )}
                {internship.stipend !== null && internship.stipend !== undefined && (
                  <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-none rounded-2xl px-4 py-2 font-bold text-[12px] flex items-center gap-1.5 shadow-sm">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {formatSalary(internship.stipend)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="flex items-center justify-between mt-8 overflow-x-auto border-b border-slate-100 -mx-6 px-6">
            {["Description", "Company", "Benefits", "Requirements"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={cn(
                  "pb-4 text-[13px] font-bold transition-all relative whitespace-nowrap",
                  activeTab === tab.toLowerCase() ? "text-[#ec5b13]" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
                {activeTab === tab.toLowerCase() && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ec5b13] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Tab Content */}
        <div className="px-6 pt-8 pb-12">
          {activeTab === "description" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ec5b13]" />
                <h3 className="text-[17px] font-bold text-slate-900">Job Description</h3>
              </div>
              <div className="text-slate-600 leading-relaxed text-[15px] space-y-5">
                {typeof internship.description === "string" ? (
                  <p className="whitespace-pre-wrap">{internship.description}</p>
                ) : (
                  internship.description || <p>No description provided.</p>
                )}
                {internship.location && (
                  <div className="mt-8 overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                    <div className="relative h-52 w-full">
                      <Image src="/images/map-placeholder.png" alt="Company Location" fill className="object-cover" />
                      <div className="absolute inset-0 bg-blue-400/10" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 rounded-full bg-orange-500/30 animate-ping absolute scale-150" />
                        <div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-lg relative z-10" />
                      </div>
                    </div>
                    <div className="bg-[#fcfdfd] p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">LOCATION</h4>
                        <p className="text-[14px] text-slate-900 font-bold">{toTitleCase(internship.location)}</p>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(internship.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ec5b13] font-bold text-[13px] flex items-center gap-1 hover:underline"
                      >
                        Get Directions <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {internship.tags && internship.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-4 text-[15px]">Skills & Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {internship.tags
                      .filter((tag) => !["remote", "onsite", "hybrid"].includes(tag.toLowerCase()))
                      .map((tag, i) => (
                        <span key={i} className="bg-slate-50 text-slate-600 border border-slate-100 px-3.5 py-1.5 rounded-full text-[13px] font-bold">
                          {toTitleCase(tag)}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "requirements" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ec5b13]" />
                <h3 className="text-[17px] font-bold text-slate-900">Requirements</h3>
              </div>
              {internship.eligibility && internship.eligibility.length > 0 ? (
                <ul className="space-y-3">
                  {internship.eligibility.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 bg-slate-50/70 p-4 rounded-2xl border border-slate-50">
                      <div className="mt-0.5 p-1 bg-white rounded-lg border border-slate-100 shrink-0">
                        <GraduationCap className="w-4 h-4 text-[#ec5b13]" />
                      </div>
                      <span className="text-[14px] font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No specific eligibility criteria mentioned.</p>
              )}
            </div>
          )}
          {activeTab === "company" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ec5b13]" />
                <h3 className="text-[17px] font-bold text-slate-900">About the Company</h3>
              </div>
              <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                    <Building className="w-7 h-7 text-[#ec5b13]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{toTitleCase(internship.hiringOrganization)}</h4>
                    <p className="text-slate-500 text-sm">{internship.location ? toTitleCase(internship.location) : "Global"}</p>
                  </div>
                </div>
                {internship.companyDescription ? (
                  <p className="text-slate-600 text-[14px] leading-relaxed mb-5">
                    {internship.companyDescription}
                  </p>
                ) : (
                  <p className="text-slate-600 text-[14px] leading-relaxed mb-5">
                    {toTitleCase(internship.hiringOrganization)} is a leading organization in the industry, focused on delivering innovation and excellence.
                  </p>
                )}
                {internship.website && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl h-11 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                    onClick={() => window.open(internship.website!, "_blank")}
                  >
                    View Website
                  </Button>
                )}
              </div>
            </div>
          )}
          {activeTab === "benefits" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ec5b13]" />
                <h3 className="text-[17px] font-bold text-slate-900">Benefits & Perks</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Competitive Stipend", value: formatSalary(internship.stipend) },
                  { label: "Mentorship", value: "Guided by senior experts" },
                  { label: "Experience Certificate", value: "Verified on completion" },
                  { label: "Pre-placement Offer", value: "Performance based" },
                ].map((benefit, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[#ec5b13] uppercase tracking-wider">{benefit.label}</span>
                    <span className="text-[14px] font-bold text-slate-900">{benefit.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Disclaimer */}
          <div className="mt-12 pt-6 border-t border-slate-100">
            <div className="flex items-start gap-3 bg-slate-50/60 p-4 rounded-2xl mb-4">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Data on this page updates every 15 minutes. Listed by <b>{toTitleCase(internship.hiringOrganization)}</b>.
              </p>
            </div>
            <div className="flex items-center gap-5 pl-2">
              <button className="flex items-center gap-1.5 text-[#0066cc] font-bold text-[13px] hover:underline">
                <Lightbulb className="w-3.5 h-3.5" /> Complaint
              </button>
              <button className="flex items-center gap-1.5 text-[#ec5b13] font-bold text-[13px] hover:underline">
                <Flag className="w-3.5 h-3.5" /> Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBookmarkClick}
              className={cn(
                "w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all active:scale-95",
                isBookmarked ? "text-orange-500 border-orange-500" : "text-slate-500 hover:text-[#ec5b13]"
              )}
            >
              <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
            </button>
            <button
              className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 hover:text-[#ec5b13] transition-all active:scale-95"
              onClick={handleCalendarClick}
            >
              <CalendarPlus className="w-5 h-5" />
            </button>
          </div>
          {(internship.applyLink || internship.link) && (
            <Link
              href={`${internship.applyLink || internship.link}${(internship.applyLink || internship.link).includes("?") ? "&" : "?"}utm_source=ftb_mobile`}
              target="_blank"
              className="flex-1 ml-4"
            >
              <Button variant="outline" className="w-full h-13 rounded-[18px] border-orange-500 text-orange-600 hover:bg-orange-50 font-extrabold focus:ring-0 active:scale-95 transition-all">
                Apply Now
              </Button>
            </Link>
          )}
          {session?.user && (
            <Button
              onClick={onSmartApplyClick}
              className="h-13 flex-1 ml-4 rounded-[18px] bg-[#ec5b13] hover:bg-[#d44d0c] text-white text-[15px] font-extrabold shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Smart Apply
            </Button>
          )}
        </footer>
      </div>

      {/* ============================================================
          DESKTOP LAYOUT (hidden on mobile, visible on md+)
      ============================================================ */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-[1000px] px-4 pt-10">

          {/* Desktop Top Card */}
          <div className="bg-white rounded-[24px] px-8 py-5 shadow-sm border border-slate-100 relative mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                {/* Badges */}
                <div className="flex flex-wrap gap-2.5 mb-5">
                  {internship.type && (
                    <Badge className="bg-orange-50 text-[#ec5b13] hover:bg-orange-100 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase shadow-none tracking-wide">
                      {internship.type.replace(/-/g, " ")}
                    </Badge>
                  )}
                  {internship.timing && (
                    <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase shadow-none tracking-wide">
                      {internship.timing.replace(/-/g, " ")}
                    </Badge>
                  )}
                </div>

                {/* Title & Company */}
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] mb-2 tracking-tight">
                  {toTitleCase(internship.title)}
                </h1>
                <h2 className="text-xl font-bold text-[#ec5b13] mb-6">
                  {toTitleCase(internship.hiringOrganization)}
                </h2>

                {/* Location, Salary, Duration */}
                <div className="flex flex-wrap items-center gap-6 text-[14px] text-slate-500 font-medium">
                  {internship.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{toTitleCase(internship.location)}</span>
                    </div>
                  )}
                  {internship.stipend !== null && internship.stipend !== undefined && (
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-slate-400" />
                      <span>{formatSalary(internship.stipend)}</span>
                    </div>
                  )}
                  {internship.duration && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{toTitleCase(internship.duration)}</span>
                    </div>
                  )}
                  {internship.deadline && (
                    <div className="flex items-center gap-2">
                      <CalendarPlus className="w-4 h-4 text-slate-400" />
                      <span>Apply By: {formatDate(internship.deadline)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={handleBookmarkClick}
                  className={cn(
                    "w-12 h-12 p-0 flex items-center justify-center rounded-xl border-slate-200 transition-all focus:ring-0",
                    isBookmarked ? "text-orange-500 border-orange-500 bg-orange-50" : "text-slate-500 hover:text-[#ec5b13] hover:border-[#ec5b13] hover:bg-orange-50"
                  )}
                >
                  <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCalendarClick}
                  className="w-12 h-12 p-0 flex items-center justify-center rounded-xl border-slate-200 text-slate-500 hover:text-[#ec5b13] hover:border-[#ec5b13] hover:bg-orange-50 transition-all focus:ring-0"
                >
                  <Image
                    src="/images/google-calendar.webp"
                    alt="Add to Google Calendar"
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                </Button>
                {(internship.applyLink || internship.link) && (
                  <Link
                    href={`${internship.applyLink || internship.link}${(internship.applyLink || internship.link).includes("?") ? "&" : "?"}utm_source=ftb_web`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="h-12 px-8 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ec5b13] font-bold border-none shadow-none transition-all">
                      Apply Now
                    </Button>
                  </Link>
                )}
                {session?.user && (
                  <Button
                    onClick={onSmartApplyClick}
                    className="h-12 px-6 rounded-xl bg-[#ec5b13] hover:bg-[#d44d0c] text-white font-bold border-none shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Smart Apply
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop Single Tab (Description) */}
            <div className="flex items-center gap-8 mt-6 border-b border-slate-100">
              <div className="pb-3 text-[15px] font-bold text-[#ec5b13] relative">
                Description
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ec5b13] rounded-t-full" />
              </div>
            </div>
          </div>

          {/* Desktop Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Description */}
            <div className="lg:col-span-2">
              <div className="text-slate-600 leading-relaxed text-[15px] max-w-[650px] space-y-4">
                {typeof internship.description === "string" ? (
                  <p className="whitespace-pre-wrap">{internship.description}</p>
                ) : (
                  internship.description || <p>No description provided.</p>
                )}
                {internship.eligibility && internship.eligibility.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-bold text-slate-800 mb-3 block">Requirements:</h4>
                    <ul className="list-disc pl-5 space-y-2 mb-6 text-slate-600">
                      {internship.eligibility.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {internship.tags && internship.tags.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-bold text-slate-800 mb-4 block">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {internship.tags
                        .filter((tag) => !["remote", "onsite", "hybrid"].includes(tag.toLowerCase()))
                        .map((tag, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[13px] font-semibold">
                            {toTitleCase(tag)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Disclaimer */}
              <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="space-y-4 text-[14px] text-slate-700">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <p>The data on this page gets updated in every 15 minutes.</p>
                  </div>
                  <div className="flex items-start gap-3 flex-wrap">
                    <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <p className="flex-1">
                      This opportunity has been listed by {toTitleCase(internship.hiringOrganization)}. FTB is not liable for any content mentioned in this opportunity or the process followed by the organizers for this opportunity. However, please raise a complaint if you want FTB to look into the matter.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-3">
                    <button className="flex items-center gap-2 text-[#0066cc] font-medium hover:underline w-fit">
                      <Lightbulb className="w-4 h-4" /> Raise a Complaint
                    </button>
                    <button className="flex items-center gap-2 text-[#ec5b13] font-medium hover:underline w-fit">
                      <Flag className="w-4 h-4" /> Report An Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[24px] p-7 shadow-sm border border-slate-100">
                <h4 className="text-[12px] font-bold text-slate-900 tracking-wider uppercase mb-5">JOB OVERVIEW</h4>
                <div className="space-y-4 text-[14px]">
                  {internship.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Posted On</span>
                      <span className="font-semibold text-slate-900">{formatDate(internship.createdAt)}</span>
                    </div>
                  )}
                  {internship.hiringOrganization && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Company</span>
                      <span className="font-semibold text-slate-900 text-right line-clamp-1">{toTitleCase(internship.hiringOrganization)}</span>
                    </div>
                  )}
                  {internship.hiringManager && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Hiring Manager</span>
                      <span className="font-semibold text-slate-900 text-right line-clamp-1">{toTitleCase(internship.hiringManager)}</span>
                    </div>
                  )}
                  {(internship.contactEmail || internship.hiringManagerEmail) && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Contact</span>
                      <a href={`mailto:${internship.contactEmail || internship.hiringManagerEmail}`} className="text-[#ec5b13] hover:underline font-semibold">
                        Email
                      </a>
                    </div>
                  )}
                  {internship.postUrl && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Original Post</span>
                      <a href={internship.postUrl} target="_blank" rel="noopener noreferrer" className="text-[#ec5b13] hover:underline font-semibold">
                        View
                      </a>
                    </div>
                  )}
                  {internship.tags && internship.tags.length > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Industry</span>
                      <span className="font-semibold text-slate-900 text-right line-clamp-1">{toTitleCase(internship.tags[0])}</span>
                    </div>
                  )}
                  {internship.experience && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Experience</span>
                      <span className="font-semibold text-slate-900 text-right line-clamp-1">{toTitleCase(internship.experience)}</span>
                    </div>
                  )}
                  {internship.deadline && (
                    <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                      <span className="text-slate-500">Apply By</span>
                      <span className="font-bold text-[#ec5b13]">{formatDate(internship.deadline)}</span>
                    </div>
                  )}
                </div>
                {internship.location && (
                  <div className="mt-5 bg-slate-50/80 rounded-xl p-5">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">LOCATION</h5>
                    <p className="text-[14px] text-slate-700 font-medium">{toTitleCase(internship.location)}</p>
                  </div>
                )}
              </div>

              {/* Need Help Card */}
              <div className="bg-[#fff6f0] border border-[#ffeadb] rounded-[24px] p-7">
                <h4 className="text-[16px] font-bold text-[#ec5b13] mb-2">Need Help?</h4>
                <p className="text-[14px] text-slate-600 mb-6 leading-relaxed">
                  Have questions about the application process? Chat with our recruitment bot.
                </p>
                <Button
                  variant="outline"
                  onClick={handleOpenChat}
                  className="w-full bg-transparent border-[#ec5b13] text-[#ec5b13] hover:bg-[#ec5b13] hover:text-white font-semibold h-11 rounded-xl transition-all text-[14px]"
                >
                  Open Chat
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={handleShareDialogOpenChange}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogTitle className="sr-only">Share {internship.title}</DialogTitle>
          <DialogDescription className="sr-only">Share this internship via social media or copy the link</DialogDescription>
          <ShareDialog shareUrl={shareUrl} title={internship.title} onCopy={handleCopy} onShare={handleShare} />
        </DialogContent>
      </Dialog>

      {/* Smart Apply Modal */}
      <ApplyModal
        isOpen={smartApplyOpen}
        onClose={() => setSmartApplyOpen(false)}
        opportunity={internship ? mapInternshipToApplyOpportunity(internship) : null}
      />
    </div>
  );
}
