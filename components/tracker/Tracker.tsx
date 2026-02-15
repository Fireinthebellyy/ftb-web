"use client";

import React, { useState, useMemo } from 'react';
import { useTracker, TrackerItem } from '@/components/providers/TrackerProvider';
import { AlertCircle, FileText, CalendarDays, TrendingUp, LucideIcon, Loader2, Activity, ChevronRight, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';


import TrackerDetailModal from './TrackerDetailModal';
import ApplyModal from './ApplyModal';
import EventCard from './EventCard';
import TrackerRow from './TrackerRow';
import MobileTrackerCard from './MobileTrackerCard';



interface EnrichedTrackerItem extends TrackerItem {
    isHighPriority: boolean;
}

interface MetricCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    color: string;
    highlight?: boolean;
}

export default function Tracker() {
    // Helper for Priority
    const isHighPriority = (deadline?: string) => {
        if (!deadline) return false;
        const diff = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
    };

    const { items, events, removeEvent, updateStatus, removeFromTracker, isLoading } = useTracker();

    const [activeTab, setActiveTab] = useState<'internship' | 'opportunity'>('internship');


    const [detailOpp, setDetailOpp] = useState<any>(null);
    const [smartApplyOpp, setSmartApplyOpp] = useState<any>(null);
    const [showInsights, setShowInsights] = useState(false);


    // Hydrate & Enhance Logic
    const filteredItems = items.filter(i => (i.kind || 'internship') === activeTab);

    const trackedOpps = useMemo(() => {
        return filteredItems.map(item => {
            // Data is already hydrated in Provider, just calculate priority
            // For manual items that might miss some fields, we handle gracefully

            return {
                ...item,
                isHighPriority: isHighPriority(item.deadline)
            } as EnrichedTrackerItem;
        });
    }, [filteredItems]);

    // Metrics Calculation
    const total = trackedOpps.length;

    // Total Applied: Everything where status is NOT 'Not Applied' and NOT 'Draft'
    const totalApplications = trackedOpps.filter(i => i.status !== 'Not Applied' && i.status !== 'Draft').length;
    const totalSelected = trackedOpps.filter(i => i.status === 'Selected').length;

    const successRate = totalApplications > 0 ? Math.round((totalSelected / totalApplications) * 100) : 0;
    const actionRate = total > 0 ? Math.round((totalApplications / total) * 100) : 0;

    // Agenda Logic (Deadlines + Events)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const agendaItems = [
        ...events.map(e => ({ ...e, isEvent: true, date: new Date(e.date).getTime() })),
        ...trackedOpps.filter(o => o.deadline && o.status !== 'Selected' && o.status !== 'Rejected').map(o => ({
            id: o.oppId,
            title: `Deadline: ${o.title}`,
            date: new Date(o.deadline!).getTime(),
            type: 'Deadline',
            description: o.company,
            isEvent: false,
            opp: o
        }))
    ]
        .sort((a, b) => a.date - b.date)
        .filter(i => {
            const d = new Date(i.date);
            return d >= new Date() && d <= nextWeek;
        });





    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header & Metrics */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Personal Tracker</h2>
                    <p className="text-slate-500">Track, Manage, and Optimize your {activeTab} search.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Tab Switcher */}
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center justify-center">
                        <button
                            onClick={() => setActiveTab('internship')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-bold transition-all flex justify-center items-center gap-2",
                                activeTab === 'internship' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Internships
                        </button>
                        <button
                            onClick={() => setActiveTab('opportunity')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-bold transition-all flex justify-center items-center gap-2",
                                activeTab === 'opportunity' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Opportunities
                        </button>
                    </div>

                </div>
            </div>



            {/* Insights Toggle Bar */}
            {!showInsights && (
                <button
                    onClick={() => setShowInsights(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl shadow-lg border border-orange-500/30 flex items-center justify-between group transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                        <div className="text-left">
                            <span className="font-bold text-lg">Check Insights</span>
                            <p className="text-orange-100 text-sm">View your success rate and tracking progress</p>
                        </div>
                    </div>
                    <ChevronRight size={24} className="text-orange-200 group-hover:translate-x-1 transition-transform" />
                </button>
            )}

            <AnimatePresence>
                {showInsights && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden space-y-6"
                    >
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                <TrendingUp className="text-orange-500" size={20} />
                                Tracking Insights
                            </h3>
                            <button
                                onClick={() => setShowInsights(false)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                title="Close Insights"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mobile Metrics Card (Consolidated) */}
                        <div className="md:hidden bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{total}</h3>
                                    <p className="text-slate-500 text-sm">Total Tracked</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-2xl font-bold text-emerald-600">{successRate}%</h3>
                                    <p className="text-slate-500 text-sm">Success Rate</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-blue-50 p-3 rounded-xl relative z-10 border border-blue-200">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900">{actionRate}%</h4>
                                    <p className="text-xs text-slate-500">Action Rate</p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Metrics Grid */}
                        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard icon={FileText} label="Total Tracked" value={total} color="bg-slate-100 text-slate-700" />
                            <MetricCard icon={TrendingUp} label="Success Rate" value={`${successRate}%`} color="bg-emerald-50 text-emerald-700" />
                            <MetricCard icon={Activity} label="Action Rate" value={`${actionRate}%`} color="bg-blue-50 text-blue-700" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Content */}
            <div className="space-y-8">
                {/* Agenda Section */}
                {agendaItems.length > 0 && (
                    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden hidden md:block">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                <CalendarDays size={20} className="text-indigo-600" />
                                Your Agenda
                            </h3>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Next 7 Days
                            </span>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {agendaItems.slice(0, 3).map((item, _idx) => (
                                item.isEvent ? (
                                    <EventCard key={item.id} event={item as any} onDelete={removeEvent} />
                                ) : (
                                    <div key={item.id} className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                                                <AlertCircle size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm leading-tight">{(item as any).opp.title}</p>
                                                <p className="text-xs text-amber-800 mt-1">{(item as any).opp.company}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="text-xs font-bold text-amber-700">{new Date(item.date).toLocaleDateString()}</span>
                                            <button
                                                onClick={() => updateStatus(item.id, 'Applied')}
                                                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </section>
                )}

                {/* Main List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-t-2xl">
                        <h3 className="font-bold text-slate-900 text-sm md:text-lg shrink-0">Saved {activeTab === 'internship' ? 'Internships' : 'Opportunities'}</h3>
                        <Link
                            href="/toolkit"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] md:text-sm font-bold transition-all shadow-sm hover:shadow-orange-200"
                        >
                            <Zap size={14} className="fill-white" />
                            <span>10x Chances</span>
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {trackedOpps
                            .sort((a, b) => {
                                const dateA = a.deadline ? new Date(a.deadline).getTime() : 9999999999999;
                                const dateB = b.deadline ? new Date(b.deadline).getTime() : 9999999999999;
                                return dateA - dateB;
                            })
                            .map(opp => (
                                <div key={opp.oppId}>
                                    <div className="md:hidden">
                                        <MobileTrackerCard
                                            opp={opp}
                                            updateStatus={updateStatus}
                                            onDelete={removeFromTracker}
                                            onClick={(o) => {
                                                setDetailOpp(o);
                                            }}
                                        />
                                    </div>
                                    <div className="hidden md:block">
                                        <TrackerRow
                                            opp={opp}
                                            updateStatus={updateStatus}
                                            onDelete={removeFromTracker}
                                            onClick={(o) => {
                                                setDetailOpp(o);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        {trackedOpps.length === 0 && (
                            <div className="p-8 text-center text-slate-500">
                                No applications tracked yet. Start by adding one!
                            </div>
                        )}
                    </div>
                </div>
            </div>



            <TrackerDetailModal
                isOpen={!!detailOpp}
                onClose={() => setDetailOpp(null)}
                opportunity={detailOpp}
                updateStatus={updateStatus}
                onSmartApply={() => {
                    setSmartApplyOpp(detailOpp);
                    setDetailOpp(null);
                }}
            />



            <ApplyModal
                isOpen={!!smartApplyOpp}
                onClose={() => setSmartApplyOpp(null)}
                opportunity={smartApplyOpp}
            />
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color, highlight }: MetricCardProps) {
    return (
        <div className={cn(
            "p-5 rounded-2xl border transition-all",
            highlight ? "bg-white border-amber-300 shadow-md ring-2 ring-amber-100" : "bg-white border-slate-200"
        )}>
            <div className="flex items-center gap-3 mb-2">
                <div className={cn("p-2 rounded-lg", color)}>
                    <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-slate-500">{label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 ml-1">{value}</p>
        </div>
    );
}
