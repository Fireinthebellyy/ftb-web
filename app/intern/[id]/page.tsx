"use client";

import React, { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapPin, Building2, IndianRupee, ExternalLink, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ShareDialog } from "@/components/internship/ShareDialog";

interface InternshipData {
  id: string;
  type: string;
  timing: string;
  title: string;
  description: string;
  link: string;
  poster: string;
  tags: string[];
  location: string;
  deadline: Date | null;
  stipend: number;
  hiringOrganization: string;
  hiringManager: string;
  hiringManagerEmail: string;
  experience: string;
  duration?: string;
  eligibility: string[];
  createdAt: Date | null;
  viewCount: number;
  applicationCount: number;
  user: {
    id: string;
    name: string;
    image: string;
    role: string;
  };
}

export default function InternshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<InternshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);

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

  const getTypeColor = (_type?: string): string => {
    return "bg-white border border-gray-300 text-black";
  };

  const getTimingColor = (_timing?: string): string => {
    return "bg-white border border-gray-300 text-black";
  };

  const publicBaseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = publicBaseUrl ? `${publicBaseUrl}/intern/${id}` : `/intern/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareDialogOpenChange = (open: boolean) => {
    setShareDialogOpen(open);
  };

  if (loading || !internship) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6 relative">
        {/* Logo, Title, Organization */}
        <div className="flex gap-4 mb-4">
          {/* Logo in top left corner */}
          {internship.poster && (
            <div className="flex-shrink-0">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src={internship.poster}
                  alt={`${internship.hiringOrganization} logo`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Title, Organization and Apply Button */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">{internship.title}</h1>
              <div className="flex items-center gap-2 text-sm sm:text-lg text-gray-700">
                <Building2 className="w-4 h-4 hidden sm:block" />
                <span>{internship.hiringOrganization}</span>
              </div>
            </div>
            
            {/* Apply Button */}
            {internship.link && (
              <Link href={`${internship.link}${internship.link.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=internship_detail&utm_campaign=internship_apply`} target="_blank" rel="noopener noreferrer">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium w-full sm:w-auto px-6 py-2">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Apply
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Location */}
        {internship.location && (
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-black" />
            <span className="text-sm font-medium line-clamp-1">{internship.location}</span>
          </div>
        )}

        {/* Type and Timing Badges */}
        <div className="flex gap-2">
          <Badge
            className={`${getTypeColor(internship.type)} text-xs sm:text-sm`}
          >
            {internship.type?.charAt(0).toUpperCase() + internship.type?.slice(1).replace(/-/g, " ")}
          </Badge>
          {internship.timing && (
            <Badge
              className={`${getTimingColor(internship.timing)} text-xs sm:text-sm`}
            >
              {internship.timing?.charAt(0).toUpperCase() + internship.timing?.slice(1).replace(/-/g, " ")}
            </Badge>
          )}
        </div>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={handleShareDialogOpenChange}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShareDialogOpen(true);
            }}
            className="absolute bottom-5 right-6 p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-black hover:text-orange-500" />
          </button>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
          <ShareDialog
            shareUrl={shareUrl}
            title={internship.title}
            onCopy={handleCopy}
          />
          </DialogContent>
        </Dialog>
      </div>

      {/* Description */}
      {internship.description && (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="font-semibold mb-4 text-lg sm:text-xl">Description</h2>
          <div className="prose max-w-none text-black text-sm sm:text-base">
            {typeof internship.description === "string" ? (
              <p className="whitespace-pre-wrap">{internship.description}</p>
            ) : (
              internship.description
            )}
          </div>
        </div>
      )}

      {/* Eligibility, Experience & Internship Details */}
      {(internship.eligibility && internship.eligibility.length > 0) || internship.experience || internship.type || internship.timing || typeof internship.stipend === "number" ? (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 sm:text-xl">More Information</h2>

          {/* Internship Type */}
          {internship.type && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-4 sm:text-lg">Internship Type</h2>
              <p className="text-sm sm:text-base text-black">
                {internship.type?.charAt(0).toUpperCase() + internship.type?.slice(1).replace(/-/g, " ")}
              </p>
            </div>
          )}

          {/* Internship Timing */}
          {internship.timing && (
            <div className="mb-6">
              <h2 className="font-semibold mb-4 text-sm sm:text-lg">Internship Timing</h2>
              <p className="text-sm sm:text-base text-black">
                {internship.timing?.charAt(0).toUpperCase() + internship.timing?.slice(1).replace(/-/g, " ")}
              </p>
            </div>
          )}

          {/* Stipend */}
          {typeof internship.stipend === "number" && (
            <div className="mb-6">
              <h2 className="font-semibold mb-4 text-sm sm:text-lg">Stipend</h2>
              <p className="text-sm sm:text-base text-black flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {internship.stipend.toLocaleString()}
              </p>
            </div>
          )}

          {/* Tags */}
          {internship.tags && internship.tags.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold mb-4 text-sm sm:text-lg">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {internship.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    className="border border-gray-300 bg-white text-black text-xs sm:text-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Eligibility */}
          {internship.eligibility && internship.eligibility.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold mb-4 text-sm sm:text-lg">Eligibility</h2>
              <div className="flex flex-wrap gap-2">
                {internship.eligibility.map((item, index) => (
                  <Badge
                    key={index}
                    className="border border-gray-300 bg-white text-black text-xs sm:text-sm"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {internship.experience && (
            <div className="mb-6">
              <h2 className="font-semibold mb-4 text-sm sm:text-lg">Experience Required</h2>
              <p className="text-sm sm:text-base text-black">
                {internship.experience}
              </p>
            </div>
          )}

          {/* Duration */}
          {internship.duration && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-4 sm:text-lg">Internship Duration</h2>
              <p className="text-sm sm:text-base text-black">
                {internship.duration}
              </p>
            </div>
          )}

          {/* Deadline */}
          {internship.deadline && (
            <div>
              <h2 className="text-sm font-semibold mb-4 sm:text-lg">Deadline</h2>
              <p className="text-sm sm:text-base text-black">
                {new Date(internship.deadline).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Contact Information */}
      {(internship.hiringManager || internship.hiringManagerEmail || internship.user) && (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 sm:text-xl">Contact Information</h2>
          <div className="space-y-3">
            {internship.hiringManager && (
              <div className="flex items-center gap-2">
                  <span className="text-md font-semibold text-sm sm:text-md">Hiring Manager:</span> <span className="text-sm sm:text-base">{internship.hiringManager}</span>
              </div>
            )}
            {internship.hiringManagerEmail && (
              <div className="flex items-center gap-2">
                  <span className="text-md font-semibold text-sm sm:text-md">Email Id:</span> <span className="text-sm sm:text-base">{internship.hiringManagerEmail}</span>
              </div>
            )}
            {internship.user && (
              <div className="flex items-center gap-2">
              
                  <span className="text-md font-semibold text-sm sm:text-md">Posted by:</span>   <div className="w-8 h-8 rounded-full border-2 border-amber-500 bg-gray-300 flex items-center justify-center">
                  {internship.user.image ? (
                    <Image
                      src={internship.user.image}
                      alt={internship.user.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-black">
                      {internship.user.name?.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2) || "?"}
                    </span>
                  )}
                </div>
                <span className="text-sm sm:text-base">{internship.user.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
