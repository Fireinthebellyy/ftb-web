"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { X, ExternalLink, Play, Rocket } from 'lucide-react';
import { useTracker } from '../providers/TrackerProvider';


import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// Flexible interface to handle TrackerItem, Internship, or Opportunity
export interface ApplyModalOpportunity {
    id: number | string;
    title: string;
    company?: string;
    hiringOrganization?: string;
    organiserInfo?: string;
    logo?: string;
    poster?: string;
    images?: string[];
    skills?: string[];
    tags?: string[];
    [key: string]: unknown;
}

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: ApplyModalOpportunity | null;
}

export default function ApplyModal({ isOpen, onClose, opportunity }: ApplyModalProps) {
    const { addToTracker } = useTracker();
    const router = useRouter();


    if (!opportunity) return null;

    // Helper to normalize display data
    const displayData = {
        company: opportunity.company || opportunity.hiringOrganization || opportunity.organiserInfo || "Unknown Organization",
        logo: opportunity.logo || opportunity.poster || (opportunity.images && opportunity.images[0]),
        title: opportunity.title
    };



    const handleSubmit = () => {
        // Proceed to tracker (Toolkit access)
        let oppId: number | string = opportunity.id;

        // Ensure proper ID format if it's a string static ID
        const rawId = opportunity.id as unknown as string | number;
        if (typeof rawId === 'string' && rawId.startsWith('static-')) {
            const suffix = rawId.replace('static-', '');
            if (/^\d+$/.test(suffix)) {
                oppId = parseInt(suffix, 10);
            }
            // If not numeric suffix, keep the original string ID
        }

        addToTracker({ ...opportunity, id: oppId }, 'Not Applied');
        onClose();
        router.push('/tracker');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} aria-describedby={undefined} className="max-w-2xl p-0 bg-transparent border-none shadow-none text-black">
                <div className="relative bg-white rounded-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Rocket size={10} /> Smart Apply
                                </span>
                            </div>
                            <DialogTitle className="text-xl font-bold text-slate-900">
                                {displayData.company}
                            </DialogTitle>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 max-h-[60vh] space-y-8">

                        {/* 1. Video Teaser */}
                        <div className="space-y-6">
                            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center group cursor-pointer shadow-md">
                                <NextImage
                                    src={(opportunity.images && opportunity.images.length > 0) ? opportunity.images[0] : (opportunity.poster || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000")}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                                    alt="Office Teaser"
                                    width={1000}
                                    height={562}
                                />
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform mb-3">
                                        <Play size={24} className="fill-white text-white ml-1" />
                                    </div>
                                    <span className="text-white font-bold text-lg drop-shadow-md">{displayData.company}</span>
                                </div>
                            </div>


                        </div>



                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all hover:scale-[1.02]"
                        >
                            Go <ExternalLink size={18} />
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
