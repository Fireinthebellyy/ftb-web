"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Unlock} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import PageBannerCarousel from "@/components/banner/PageBannerCarousel";

interface ColdDmTemplate {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "image" | "document";
  fileUrl: string;
  previewImageUrl?: string;
  price: number;
  originalPrice?: number;
  isPurchased?: boolean;
}

interface ColdDmSettings {
  coldDmShowPageBanner: boolean;
  coldDmShowTemplates: boolean;
}

interface ColdDmPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedinUrl: string;
  internshipId: string;
  internshipTitle: string;
}

export const ColdDmPopup: React.FC<ColdDmPopupProps> = ({
  open,
  onOpenChange,
  linkedinUrl,
}) => {
  const router = useRouter();
  const [templates, setTemplates] = useState<ColdDmTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ColdDmSettings>({
    coldDmShowPageBanner: true,
    coldDmShowTemplates: true,
  });

  useEffect(() => {
    if (open) {
      fetchSettings();
      fetchTemplates();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      const settingsRes = await fetch("/api/settings/cold-dm");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error fetching Cold DM settings:", error);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const templatesRes = await fetch("/api/cold-dm/templates");

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }
    } catch (error) {
      console.error("Error fetching Cold DM templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: ColdDmTemplate) => {
    if (template.isPurchased) {
      window.open(template.fileUrl, "_blank");
    } else {
      onOpenChange(false);
      setTimeout(() => {
        router.push(`/cold-dm/checkout?templateId=${template.id}`);
      }, 100);
    }
  };

  const shouldShowPopup = settings.coldDmShowPageBanner || settings.coldDmShowTemplates;

  if (!shouldShowPopup) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-h-[90vh] overflow-y-auto p-0 rounded-2xl"
        showCloseButton={true}
      >
        <div className="flex flex-col">
          {/* Cold DM Direct Option */}
          <div className="p-4 pt-15 pb-0 border-b border-slate-100">
            <Link
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="cursor-pointer w-full h-11 sm:h-14 rounded-xl bg-[#0077b5] hover:bg-[#005987] text-white font-bold border-none shadow-none transition-all active:scale-95 duration-200 flex items-center justify-center gap-2 text-xs sm:text-base">
                <Image
                  src="/images/linkedin.svg"
                  alt="LinkedIn"
                  width={16}
                  height={16}
                  className="w-3 h-3 sm:w-4 sm:h-4 object-contain brightness-0 invert"
                />
                Cold DM Directly
              </Button>
            </Link>
          </div>

          {/* Cold DM Templates Section */}
          {settings.coldDmShowTemplates && templates.length > 0 && (
            <div className="p-4 pb-0 border-b border-slate-100">
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="relative">
                    {/* 10x Response Rate Badge - Outside Border, Top Right */}
                    <div className="absolute sm:-top-3.5 -top-4.5 -right-1 z-10">
                      <span className="inline-flex items-center px-2 py-1 bg-slate-600 text-white text-[8px] sm:text-[10px] font-bold rounded-md shadow-md">
                        10x response rate
                      </span>
                    </div>

                    <button
                      onClick={() => handleTemplateClick(template)}
                      className="cursor-pointer w-full p-4 pt-2 pb-2 rounded-xl bg-orange-200 hover:bg-orange-300 transition-all text-left shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-black text-xs sm:text-base">
                              {template.title}
                            </h4>
                            {template.isPurchased ? (
                              <Unlock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                            ) : (
                              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                            )}
                          </div>
                          {template.description && (
                            <p className="text-[10px] sm:text-xs text-black mb-2">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {template.isPurchased ? (
                              <span className="text-[10px] sm:text-xs font-semibold text-green-600">
                                Unlocked
                              </span>
                            ) : (
                              <>
                                <span className="text-xs sm:text-sm font-bold text-orange-700">
                                  ₹{template.price}
                                </span>
                                {template.originalPrice && (
                                  <span className="text-[10px] sm:text-xs font-bold text-black line-through">
                                    ₹{template.originalPrice}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Carousel Section */}
          {settings.coldDmShowPageBanner && (
            <div className="sm:p-4 pr-4 pl-4 [@media(min-width:310px)_and_(max-width:365px)]:-mt-2 [@media(min-width:450px)_and_(max-width:639px)]:mt-3 [@media(min-width:450px)_and_(max-width:639px)]:mb-3">
              <PageBannerCarousel placement="cold-dm" className="w-full"/>
            </div>
          )}

          {loading && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Loading...
            </div>
          )}

          {!loading && settings.coldDmShowTemplates && templates.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No templates available yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
