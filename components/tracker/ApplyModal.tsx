"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { X, CheckCircle2, ExternalLink, AlertCircle, Play, ArrowRight, Target, Sparkles, ChevronLeft, Rocket } from 'lucide-react';
import clsx from 'clsx';
import { useTracker } from '../providers/TrackerProvider';
import { Opportunity } from '@/data/opportunities';
import { calculateFitScore } from '@/lib/fitEngine';
import { userProfile } from '@/data/userProfile';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: Opportunity | null;
}

export default function ApplyModal({ isOpen, onClose, opportunity }: ApplyModalProps) {
    const { addToTracker } = useTracker();
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Reset on open
    useEffect(() => {
        if (isOpen && opportunity) {
            setStep(1);
        }
    }, [isOpen, opportunity]);

    if (!opportunity) return null;

    // --- Logic ---
    // Gap Analysis using shared engine
    const { missingSkills } = calculateFitScore(opportunity, userProfile);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

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
            <DialogContent className="max-w-2xl p-0 bg-transparent border-none shadow-none text-black">
                <div className="relative bg-white rounded-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                    Step {step} of 2
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {step === 1 && `Insight: ${opportunity.company || (opportunity as any).hiringOrganization}`}
                                {step === 2 && "Review & Submit"}
                            </h3>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
                        {step === 1 && (
                            <div className="space-y-6">
                                {/* Video Teaser */}
                                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center group cursor-pointer shadow-md">
                                    <NextImage
                                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000"
                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                                        alt="Office Teaser"
                                        width={1000}
                                        height={562}
                                    />
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform mb-3">
                                            <Play size={24} className="fill-white text-white ml-1" />
                                        </div>
                                        <span className="text-white font-bold text-lg drop-shadow-md">Insider Look: {opportunity.company || (opportunity as any).hiringOrganization}</span>
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
                        )}

                        {step === 2 && (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Rocket size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to Launch?</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-8">
                                    You&apos;re about to apply to <b>{opportunity.company || (opportunity as any).hiringOrganization}</b>. We&apos;ve saved your notes and drafted your responses.
                                </p>

                                <div className="bg-slate-50 max-w-sm mx-auto rounded-xl p-4 border border-slate-200 text-left mb-8">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Summary</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Role</span>
                                            <span className="font-medium">{opportunity.title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Company</span>
                                            <span className="font-medium">{opportunity.company || (opportunity as any).hiringOrganization}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between">
                        {step > 1 ? (
                            <button onClick={handleBack} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2">
                                <ChevronLeft size={18} /> Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {step < 2 ? (
                            <button
                                onClick={handleNext}
                                className={clsx(
                                    "px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg",
                                    "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl"
                                )}
                            >
                                Next Step <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2"
                            >
                                Proceed <ExternalLink size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
