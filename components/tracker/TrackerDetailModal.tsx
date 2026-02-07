import React from 'react';
import { ExternalLink, Calculator, Target, Lightbulb, AlertTriangle, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { userProfile } from '@/data/userProfile';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TrackerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: any;
    updateStatus: (id: number, status: string) => void;
    onSmartApply: () => void;
}

export default function TrackerDetailModal({ isOpen, onClose, opportunity, updateStatus, onSmartApply }: TrackerDetailModalProps) {
    if (!opportunity) return null;

    // --- Gap Analysis Logic ---
    const requiredSkills = opportunity.skills || [];
    const userSkills = userProfile.skills || [];
    const missingSkills = requiredSkills.filter((skill: string) => !userSkills.includes(skill));
    const matchPercentage = opportunity.fitScore || 0;

    // --- Status Logic ---
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateStatus(opportunity.oppId, e.target.value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white/5 backdrop-blur-3xl border-white/10">
                <div className="relative bg-white w-full h-full flex flex-col max-h-[90vh]">

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

                        {/* 1. Description & Expectations */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-6">
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
                                        {opportunity.expectations?.map((exp: string, i: number) => (
                                            <li key={i}>{exp}</li>
                                        )) || <li>Details coming soon...</li>}
                                    </ul>
                                </section>
                            </div>

                            {/* 2. Suggestion Box (Gap Analysis) */}
                            <div className="col-span-1">
                                <div className={clsx(
                                    "rounded-xl p-4 border",
                                    matchPercentage >= 80 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                                )}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lightbulb size={20} className={matchPercentage >= 80 ? "text-emerald-600" : "text-amber-600"} />
                                        <h4 className={clsx("font-bold text-sm", matchPercentage >= 80 ? "text-emerald-800" : "text-amber-800")}>
                                            Fit Analysis
                                        </h4>
                                    </div>

                                    {matchPercentage >= 80 ? (
                                        <div className="space-y-2">
                                            <p className="text-xs text-emerald-700">You are a strong match! Focus on:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {userProfile.skills.slice(0, 3).map((s: string) => (
                                                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-emerald-200 text-emerald-700">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-xs text-amber-800 font-medium">Missing Skills:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {missingSkills.slice(0, 3).map((s: string) => (
                                                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-amber-200 text-amber-700 flex items-center gap-1">
                                                        <AlertTriangle size={8} /> {s}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="bg-white/60 p-2 rounded-lg text-[10px] text-amber-800 italic border border-amber-100">
                                                Tip: Take a quick standard assessment for {missingSkills[0] || "these skills"} to boost your profile.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <label className="text-sm font-medium text-slate-500 whitespace-nowrap">Current Status:</label>
                            <select
                                value={opportunity.status}
                                onChange={handleStatusChange}
                                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            >
                                <option value="Not Applied">Not Applied</option>
                                <option value="Applied">Applied</option>
                                <option value="Interview">Interview</option>
                                <option value="Selected">Selected</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={onSmartApply}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <span>Smart Apply</span> <Sparkles size={16} />
                            </button>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); alert("Redirecting to external application..."); }}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <span>Apply</span> <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
