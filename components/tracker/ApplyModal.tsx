"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Calendar, Wrench, ArrowRight } from "lucide-react";
import { useTracker } from "../providers/TrackerProvider";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

export default function ApplyModal({
    isOpen,
    onClose,
    opportunity,
}: ApplyModalProps) {
    const { addToTracker } = useTracker();
    const router = useRouter();

    if (!opportunity) return null;

    const handleSubmit = () => {
        // Proceed to tracker (Toolkit access)
        const oppId: number | string = opportunity.id;

        addToTracker({ ...opportunity, id: oppId }, "Not Applied");
        onClose();
        router.push("/tracker");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                aria-describedby={undefined}
                className="fixed bottom-0 left-0 right-0 top-auto w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-[32px] rounded-b-none border-none bg-[#FAFAF9] p-6 text-black shadow-2xl focus:outline-none focus:ring-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:w-full sm:max-w-sm sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[32px] data-[state=open]:sm:slide-in-from-bottom-0 data-[state=open]:sm:zoom-in-95 data-[state=closed]:sm:slide-out-to-bottom-0 data-[state=closed]:sm:zoom-out-95"
            >
                <div className="flex flex-col items-center pt-2">
                    {/* Top handle bar if needed for mobile, otherwise standard styling */}
                    <div className="mb-6 h-1 w-10 rounded-full bg-orange-200/50" />

                    {/* Heading */}
                    <DialogTitle className="mb-2 text-center text-2xl font-bold text-slate-900">
                        Smart Apply
                    </DialogTitle>
                    <DialogDescription className="mb-8 text-center text-sm font-medium text-slate-500">
                        10x your chances by applying smartly
                    </DialogDescription>

                    {/* Value Props */}
                    <div className="w-full space-y-3">
                        {/* Add to Tracker */}
                        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                            <div className="flex shrink-0 items-center justify-center rounded-xl bg-orange-50 p-3 text-orange-500">
                                <LayoutGrid size={24} className="fill-orange-400 stroke-orange-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Add to Tracker</h4>
                                <p className="text-xs font-medium text-slate-400">
                                    Every application. One Dashboard. Zero Chaos.
                                </p>
                            </div>
                        </div>

                        {/* Add to Calendar */}
                        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                            <div className="flex shrink-0 items-center justify-center rounded-xl bg-orange-50 p-3 text-orange-500">
                                <Calendar size={24} className="stroke-orange-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Add to Calendar</h4>
                                <p className="text-xs font-medium text-slate-400">
                                    Deadlines synced. Mind freed. No slips, no stress.
                                </p>
                            </div>
                        </div>

                        {/* Access Toolkits */}
                        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                            <div className="flex shrink-0 items-center justify-center rounded-xl bg-orange-50 p-3 text-orange-500">
                                <Wrench size={24} className="fill-orange-400 stroke-orange-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Access Toolkits</h4>
                                <p className="text-xs font-medium text-slate-400">
                                    Become a hard-to-reject candidate - unfairly prepared.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="mt-8 flex w-full items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider">
                            2 EXTRA MINUTES NOW<br />
                            {'>'} GETTING GHOSTED<br />
                            LATER
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="group flex items-center justify-center gap-2 rounded-full bg-[#f97316] px-6 py-3 font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:bg-orange-600"
                        >
                            Proceed
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>

                    <div className="mt-6 h-1 w-24 rounded-full bg-slate-200" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
