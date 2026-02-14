"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { X, CheckCircle2, ExternalLink, AlertCircle, Play, Target, Sparkles, Rocket } from 'lucide-react';
import { useTracker } from '../providers/TrackerProvider';
import { calculateFitScore } from '@/lib/fitEngine';
import { useUserProfile } from '@/hooks/use-user-profile';
import { UserProfile } from '@/data/userProfile';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Flexible interface to handle TrackerItem, Internship, or Opportunity
interface ApplyModalOpportunity {
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
    [key: string]: any;
}

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: ApplyModalOpportunity | null;
}

export default function ApplyModal({ isOpen, onClose, opportunity }: ApplyModalProps) {
    const { addToTracker } = useTracker();
    const router = useRouter();
    const { data: user } = useUserProfile();

    if (!opportunity) return null;

    // Helper to normalize display data
    const displayData = {
        company: opportunity.company || opportunity.hiringOrganization || opportunity.organiserInfo || "Unknown Organization",
        logo: opportunity.logo || opportunity.poster || (opportunity.images && opportunity.images[0]),
        title: opportunity.title
    };

    // Construct profile for fit engine from DB data or fallback
    const fitProfile: UserProfile = {
        name: user?.name || "Guest",
        major: "", // Not in DB currently
        year: "", // Not in DB currently
        skills: user?.fieldInterests || [], // Mapping fieldInterests to skills as proxy
        interests: user?.opportunityInterests || [],
        maxActiveApps: 3
    };

    // --- Logic ---
    // Gap Analysis using shared engine with dynamic profile
    // If user is loading, we might show a loader or just default to empty match (safest to wait or default)
    const { missingSkills } = calculateFitScore(opportunity, fitProfile);

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

        addToTracker({ ...opportunity, id: oppId }, 'Applied');
        onClose();
        router.push('/tracker');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-2xl p-0 bg-transparent border-none shadow-none text-black">
                <div className="relative bg-white rounded-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Rocket size={10} /> Smart Apply
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {displayData.company}
                            </h3>
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

                            {/* Gap Analysis */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                    <Target size={18} className="text-indigo-600" />
                                    Skill Match Analysis
                                </h4>
                                {missingSkills.length > 0 ? (
                                    <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                                        <p className="text-sm text-rose-800 font-medium mb-2">Missing Key Skills:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {missingSkills.map((s: string) => (
                                                <span key={s} className="px-2 py-1 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-md flex items-center gap-1">
                                                    <AlertCircle size={10} /> {s}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-rose-600 mt-3 flex items-center gap-1">
                                            <Sparkles size={12} />
                                            <b>Tip:</b> Highlight willingness to learn specific missing tech in your cover letter.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center gap-3 border border-emerald-100">
                                        <CheckCircle2 size={24} />
                                        <div>
                                            <p className="font-bold">Perfect Skill Match!</p>
                                            <p className="text-sm opacity-90">You have all the listed requirements. Go get &apos;em!</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Review Summary */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Rocket size={16} className="text-slate-500" /> Application Summary
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                                    <span className="text-slate-500">Role</span>
                                    <span className="font-medium text-slate-900">{displayData.title}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                                    <span className="text-slate-500">Company</span>
                                    <span className="font-medium text-slate-900">{displayData.company}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-slate-500">Action</span>
                                    <span className="font-medium text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 size={14} /> Draft Responses Saved
                                    </span>
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
