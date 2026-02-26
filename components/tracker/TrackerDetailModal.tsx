"use client";

import React from 'react';
import { ExternalLink, Calculator, Target, Sparkles } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TrackerItem } from '@/components/providers/TrackerProvider';





interface TrackerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: TrackerItem;
    updateStatus: (id: number | string, status: string) => void;
    onSmartApply: () => void;
}

export default function TrackerDetailModal({ isOpen, onClose, opportunity, onSmartApply }: TrackerDetailModalProps) {


    if (!opportunity) return null;



    // Normalize expectations/eligibility
    const expectations = opportunity.expectations || opportunity.eligibility || [];



    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-3xl p-0 overflow-hidden bg-white/5 backdrop-blur-3xl border-white/10">
                <div className="relative bg-white w-full h-full flex flex-col max-h-[90vh]">
                    <DialogTitle className="sr-only">
                        {opportunity.title}
                    </DialogTitle>

                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-start gap-4 sticky top-0 bg-white z-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={opportunity.logo} alt={opportunity.company} className="w-16 h-16 rounded-xl object-contain bg-white border border-slate-100 p-1 shadow-sm" />
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-900">{opportunity.title}</h2>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                <span className="font-medium text-slate-700">{opportunity.company}</span>
                                <span>•</span>
                                <span>{opportunity.type}</span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto space-y-8">

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <Calculator size={16} /> Role Description
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {opportunity.description || "No description available for this role."}
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <Target size={16} /> What to Expect
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                                        {expectations.length > 0 ? (
                                            expectations.map((exp: string, i: number) => (
                                                <li key={i}>{exp}</li>
                                            ))
                                        ) : (
                                            <li>Details coming soon...</li>
                                        )}
                                    </ul>
                                </section>
                            </div>



                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-4 mt-auto">
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={onSmartApply}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <span>Smart Apply</span> <Sparkles size={16} />
                            </button>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); alert("Redirecting to external application..."); }}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-orange-500 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <span>Apply</span> <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
