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
  Building2,
  ExternalLink,
  IndianRupee,
  MapPin,
  Share2,
  Sparkles,
  Rocket,
  Briefcase,
  Clock,
  Info,
  CheckCircle,
  GraduationCap,
  Network,
  Navigation,
  Bookmark,
  Tags,
  Map,
  ArrowLeft,
  Calendar,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import posthog from "posthog-js";
import { ShareDialog } from "@/components/internship/ShareDialog";
import ApplyModal, {
  ApplyModalOpportunity,
} from "@/components/tracker/ApplyModal";
import { useSession } from "@/hooks/use-session";

interface InternshipData {
  id: string;
  type?: string | null;
  timing?: string | null;
  title: string;
  description?: string | null;
  link: string;
  tags: string[];
  location?: string | null;
  deadline: string | null;
  stipend?: number | null;
  hiringOrganization: string;
  hiringManager?: string | null;
  experience?: string | null;
  duration?: string | null;
  createdAt: string | null;
  poster?: string | null;
  eligibility?: string[];
  hiringManagerEmail?: string | null;
  user: {
    id: string;
    name: string;
    image: string;
    role: string;
  };
}

const mapInternshipToApplyOpportunity = (
  period: InternshipData
): ApplyModalOpportunity => {
  return {
    ...period, // spread other properties
    id: period.id,
    title: period.title,
    hiringOrganization: period.hiringOrganization,
    company: period.hiringOrganization,
    poster: period.poster || undefined,
    logo: period.poster || undefined,
    skills: period.tags,
    tags: period.tags,
    returnUrl: `/intern/${period.id}`,
  };
};

export default function InternshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<InternshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [smartApplyOpen, setSmartApplyOpen] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);
  const { data: session } = useSession();

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

  const handleShareDialogOpenChange = (open: boolean) => {
    setShareDialogOpen(open);
  };

  if (loading || !internship) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-48 w-full rounded bg-gray-200"></div>
            <div className="h-8 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-32 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f8f6f6] dark:bg-[#221610] pb-24 md:pb-0 text-slate-900 dark:text-slate-100">
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#f8f6f6]/95 dark:bg-[#221610]/95 px-4 py-4 md:hidden shadow-sm backdrop-blur-md">
        <button onClick={() => window.history.back()} className="text-[#ec5b13]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
          Internship Details
        </h1>
        <button onClick={() => setShareDialogOpen(true)} className="text-[#ec5b13]">
          <Share2 className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Hero (Overlay format) */}
      <div className="relative w-full h-56 md:hidden">
        {internship.poster ? (
          <Image
            src={internship.poster}
            alt="Hero Background"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-5 left-4 right-4 flex flex-col items-start gap-2">
          {internship.type && (
            <span className="bg-[#ec5b13] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
              {internship.type.replace(/-/g, " ")}
            </span>
          )}
          <h2 className="text-white text-xl font-bold leading-tight drop-shadow-md">
            {internship.title}
          </h2>
        </div>
      </div>

      {/* Mobile Company Card */}
      <div className="md:hidden mx-4 mt-4 relative bg-white dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="absolute top-3 right-3 inline-flex items-center gap-0.5 rounded bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wide">
          <CheckCircle className="h-2 w-2" />
          <span>FTB Verified</span>
        </div>
        <div className="h-14 w-14 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
          {internship.poster ? (
            <Image
              src={internship.poster}
              alt={`${internship.hiringOrganization} logo`}
              width={56}
              height={56}
              className="object-cover h-full w-full"
            />
          ) : (
            <span className="text-2xl font-black text-white">
              {internship.hiringOrganization?.charAt(0) || "?"}
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mr-16">
            {internship.hiringOrganization}
          </h3>
          <div className="flex items-center gap-1 text-[#ec5b13] text-sm font-medium mt-0.5">
            <MapPin className="h-3 w-3" />
            <span>{internship.location || "On-site"}</span>
          </div>
        </div>
      </div>

      {/* Mobile Quick Overview Section */}
      <div className="md:hidden px-4 mt-6">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
          Quick Overview
        </h4>
        <div className="flex flex-col gap-2">
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="h-9 w-9 bg-orange-500/10 rounded-lg flex items-center justify-center text-[#ec5b13] shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Duration</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {internship.duration || "N/A"}
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="h-9 w-9 bg-orange-500/10 rounded-lg flex items-center justify-center text-[#ec5b13] shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Stipend</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {typeof internship.stipend === "number" ? `₹${internship.stipend.toLocaleString()}/mo` : "Not disclosed"}
              </span>
            </div>
          </div>
          {internship.deadline && (
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="h-9 w-9 bg-orange-500/10 rounded-lg flex items-center justify-center text-[#ec5b13] shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Apply By</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {new Date(internship.deadline).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="h-9 w-9 bg-orange-500/10 rounded-lg flex items-center justify-center text-[#ec5b13] shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Openings</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Multiple positions
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 md:space-y-6">

            {/* Desktop Hero Section */}
            <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden border border-orange-500/5 shadow-sm">
              <div className="h-48 w-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 relative">
                <div className="absolute -bottom-8 left-8">
                  <div className="h-20 w-20 bg-white dark:bg-slate-900 rounded-xl shadow-lg border-4 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden">
                    {internship.poster ? (
                      <Image
                        src={internship.poster}
                        alt={`${internship.hiringOrganization} logo`}
                        width={80}
                        height={80}
                        className="object-fit h-full w-full"
                      />
                    ) : (
                      <span className="text-4xl font-black text-orange-600">
                        {internship.hiringOrganization?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-12 pb-8 px-8 flex flex-col gap-6">
                {/* Title & Apply Button Row */}
                <div className="flex flex-col md:flex-row md:justify-between gap-4 md:items-start">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      {internship.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400 font-medium pt-1">
                      <span>{internship.hiringOrganization}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span>{internship.location || "Remote"}</span>
                    </div>
                  </div>

                  {internship.link && (
                    <Link
                      href={`${internship.link}${internship.link.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=internship_detail&utm_campaign=internship_apply`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-[#ec5b13] text-white px-8 py-6 rounded-lg font-bold hover:brightness-110 transition-all shadow-lg shadow-orange-500/25">
                        Apply Now
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Smart Apply Button standalone left-aligned */}
                {session?.user && (
                  <div>
                    <Button
                      onClick={() => setSmartApplyOpen(true)}
                      variant="outline"
                      className="flex items-center gap-2 border-2 border-[#ec5b13] text-[#ec5b13] px-6 py-5 rounded-lg font-bold hover:bg-orange-500/5 transition-all shadow-sm bg-transparent"
                    >
                      <Sparkles className="h-5 w-5" />
                      Smart Apply
                    </Button>
                  </div>
                )}

                {/* Flexible Metadata Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {internship.type && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/5 text-[#ec5b13] rounded-full text-sm font-semibold border border-orange-500/10">
                      <Clock className="h-4 w-4" />
                      {internship.type.charAt(0).toUpperCase() + internship.type.slice(1).replace(/[_-]/g, " ")}
                    </div>
                  )}
                  {internship.timing && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/5 text-[#ec5b13] rounded-full text-sm font-semibold border border-orange-500/10">
                      <Clock className="h-4 w-4" />
                      {internship.timing.charAt(0).toUpperCase() + internship.timing.slice(1).replace(/[_-]/g, " ")}
                    </div>
                  )}
                  {typeof internship.stipend === "number" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/5 text-[#ec5b13] rounded-full text-sm font-semibold border border-orange-500/10">
                      <IndianRupee className="h-4 w-4" />
                      {internship.stipend.toLocaleString()}/mo
                    </div>
                  )}
                  {internship.duration && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/5 text-[#ec5b13] rounded-full text-sm font-semibold border border-orange-500/10">
                      <Clock className="h-4 w-4" />
                      {internship.duration}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description Sections */}
            {internship.description && (
              <section className="bg-white dark:bg-slate-800/50 rounded-xl p-8 border border-orange-500/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#ec5b13]">
                  <Info className="h-5 w-5 fill-current text-white dark:text-slate-900 border-2 border-[#ec5b13] bg-[#ec5b13] rounded-full" />
                  <h3 className="font-bold text-lg uppercase tracking-wider">About the Role</h3>
                </div>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
                  {typeof internship.description === "string" ? (
                    <p className="whitespace-pre-wrap">{internship.description}</p>
                  ) : (
                    internship.description
                  )}
                </div>
              </section>
            )}

            {/* Responsibilities / Eligibility */}
            {((internship.eligibility && internship.eligibility.length > 0) || (internship.tags && internship.tags.length > 0)) && (
              <section className="bg-white dark:bg-slate-800/50 rounded-xl p-8 border border-orange-500/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#ec5b13]">
                  <CheckCircle className="h-5 w-5" />
                  <h3 className="font-bold text-lg uppercase tracking-wider">Responsibilities & Tags</h3>
                </div>
                <ul className="space-y-3 pt-2">
                  {internship.eligibility?.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-[#ec5b13] mt-0.5 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                    </li>
                  ))}
                  {internship.tags?.map((tag, i) => (
                    <li key={`tag-${i}`} className="flex items-start gap-3">
                      <Tags className="h-5 w-5 text-[#ec5b13] mt-0.5 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">Tagged skill: <strong>{tag}</strong></span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="hidden md:block space-y-6">
            {/* Company Card */}
            <div className="relative bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-orange-500/5 shadow-sm text-center">
              <div className="absolute top-3 right-3 inline-flex items-center gap-0.5 rounded bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wide">
                <CheckCircle className="h-2 w-2" />
                <span>FTB Verified</span>
              </div>
              <div className="h-16 w-16 bg-orange-500/5 rounded-full flex items-center justify-center mx-auto mb-4">
                {internship.poster ? (
                  <Image
                    src={internship.poster}
                    alt={`${internship.hiringOrganization} logo`}
                    width={48}
                    height={48}
                    className="object-contain h-12 w-12"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[#ec5b13]">
                    {internship.hiringOrganization?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white pt-1">{internship.hiringOrganization}</h4>
              <p className="text-sm text-slate-500 mb-6 mt-1">Company Profile</p>

              <div className="grid grid-cols-2 gap-4 text-left">
                {internship.hiringManager && (
                  <div className="p-3 bg-[#f8f6f6] dark:bg-slate-900 rounded-lg col-span-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Hiring Manager</p>
                    <p className="text-sm font-semibold truncate">{internship.hiringManager}</p>
                  </div>
                )}
                {internship.user && (
                  <div className="p-3 bg-[#f8f6f6] dark:bg-slate-900 rounded-lg col-span-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Posted By</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-orange-500 bg-gray-300 overflow-hidden shrink-0">
                        {internship.user.image ? (
                          <Image src={internship.user.image} alt={internship.user.name} width={24} height={24} className="rounded-full object-cover" />
                        ) : (
                          <span className="text-xs text-black">
                            {internship.user.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold truncate">{internship.user.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <button className="w-full mt-6 py-2 border border-[#ec5b13]/20 text-[#ec5b13] font-bold rounded-lg hover:bg-orange-500/5 transition-colors">
                View Profile
              </button>
            </div>

            {/* Key Stats */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-orange-500/5 shadow-sm space-y-6">
              {internship.duration && (
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#ec5b13]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Duration</p>
                    <p className="font-bold text-sm">{internship.duration}</p>
                  </div>
                </div>
              )}

              {internship.experience && (
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#ec5b13]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Experience</p>
                    <p className="font-bold text-sm">{internship.experience}</p>
                  </div>
                </div>
              )}

              {internship.type && (
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#ec5b13]">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Type</p>
                    <p className="font-bold text-sm">{internship.type.charAt(0).toUpperCase() + internship.type.slice(1).replace(/-/g, " ")}</p>
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 z-50 flex items-center gap-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <Button variant="outline" className="flex-1 flex items-center justify-center gap-1.5 border-slate-200 dark:border-slate-700 h-12 rounded-xl font-bold text-slate-700 dark:text-slate-300">
          <Bookmark className="h-4 w-4" /> Save
        </Button>
        {session?.user && (
          <Button onClick={() => setSmartApplyOpen(true)} variant="outline" className="flex-1 flex items-center justify-center gap-1.5 border-orange-500 text-[#ec5b13] h-12 rounded-xl font-bold bg-orange-50 dark:bg-orange-500/10">
            <Sparkles className="h-4 w-4" /> Smart Apply
          </Button>
        )}
        {internship.link && (
          <Link
            href={`${internship.link}${internship.link.includes('?') ? '&' : '?'}utm_source=ftb_web`}
            className="flex-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full h-12 bg-[#ec5b13] hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20">
              Apply Now
            </Button>
          </Link>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={handleShareDialogOpenChange}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogTitle className="sr-only">Share {internship.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Share this internship via social media or copy the link
          </DialogDescription>
          <ShareDialog
            shareUrl={shareUrl}
            title={internship.title}
            onCopy={handleCopy}
            onShare={handleShare}
          />
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
