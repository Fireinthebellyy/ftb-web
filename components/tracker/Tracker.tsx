"use client";

import React, { useState, useMemo } from 'react';
import { useTracker, TrackerItem } from '@/components/providers/TrackerProvider';
import { Clock, AlertCircle, FileText, BrainCircuit, CalendarDays, TrendingUp, LucideIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { userProfile } from '@/data/userProfile';
import { calculateFitScore } from '@/lib/fitEngine';
import TrackerDetailModal from './TrackerDetailModal';
import ApplyModal from './ApplyModal';
import EventCard from './EventCard';
import TrackerRow from './TrackerRow';
import MobileTrackerCard from './MobileTrackerCard';
import AddEventModal from './AddEventModal';

interface EnrichedTrackerItem extends TrackerItem {
    fitScore: number;
    fitLabel: string;
    fitColor: string;
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

    const { items, events, addEvent, removeEvent, updateStatus, removeFromTracker, isLoading } = useTracker();

    const [activeTab, setActiveTab] = useState<'internship' | 'opportunity'>('internship');
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventInitialData, setEventInitialData] = useState<{ title?: string; type?: string; description?: string } | undefined>(undefined);

    const [detailOpp, setDetailOpp] = useState<any>(null);
    const [smartApplyOpp, setSmartApplyOpp] = useState<any>(null);

    // Hydrate & Enhance Logic
    const filteredItems = items.filter(i => (i.kind || 'internship') === activeTab);

    const trackedOpps = useMemo(() => {
        return filteredItems.map(item => {
            // Data is already hydrated in Provider, just calculate fit score and priority
            // For manual items that might miss some fields, we handle gracefully
            const { score, label, color } = calculateFitScore(item, userProfile);

            return {
                ...item,
                fitScore: score,
                fitLabel: label,
                fitColor: color,
                isHighPriority: isHighPriority(item.deadline)
            } as EnrichedTrackerItem;
        });
    }, [filteredItems]);

    // Metrics Calculation
    const total = trackedOpps.length;
    const applied = trackedOpps.filter(i => i.status !== 'Not Applied' && i.status !== 'Draft').length;
    const selected = trackedOpps.filter(i => i.status === 'Selected').length;
    const successRate = applied > 0 ? Math.round((selected / applied) * 100) : 0;

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

    // Priority Action Needed
    const actionNeeded = trackedOpps.filter(i => {
        if (!i.deadline) return false;
        const daysLeft = Math.ceil((new Date(i.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return ((i.status === 'Not Applied' || i.status === 'Draft') && daysLeft < 5 && daysLeft >= 0);
    });

    // Handlers for Add Calendar / Add Task
    const handleAddCalendar = (opp: any) => {
        setEventInitialData({
            title: `Follow up: ${opp.company}`,
            type: 'Deadline',
            description: `Regarding ${opp.title} application.`
        });
        setIsEventModalOpen(true);
    };

    const handleAddTask = (opp: any) => {
        setEventInitialData({
            title: `Task for ${opp.company}`,
            type: 'Task',
            description: ''
        });
        setIsEventModalOpen(true);
    };

    const handleEventSubmit = (eventData: any) => {
        addEvent(eventData);
        setIsEventModalOpen(false);
        setEventInitialData(undefined);
    };

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

                <div className="flex items-center gap-4 bg-amber-50 p-3 rounded-xl relative z-10 border border-amber-200">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-900">{actionNeeded.length}</h4>
                        <p className="text-xs text-slate-500">Pending Actions</p>
                    </div>
                    {actionNeeded.length > 0 && (
                        <div className="ml-auto w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    )}
                </div>
            </div>

            {/* Desktop Metrics Grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard icon={FileText} label="Total Tracked" value={total} color="bg-slate-100 text-slate-700" />
                <MetricCard icon={TrendingUp} label="Success Rate" value={`${successRate}%`} color="bg-emerald-50 text-emerald-700" />
                <MetricCard icon={Clock} label="Pending Actions" value={actionNeeded.length} color="bg-amber-50 text-amber-700" highlight={actionNeeded.length > 0} />
                <MetricCard icon={BrainCircuit} label="Avg Fit Score" value={`${Math.round(trackedOpps.reduce((acc, curr) => acc + curr.fitScore, 0) / (total || 1))}%`} color="bg-indigo-50 text-indigo-700" />
            </div>

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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 text-lg">All Applications by Date</h3>
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
                                            onAddCalendar={() => handleAddCalendar(opp)}
                                            onAddTask={() => handleAddTask(opp)}
                                        />
                                    </div>
                                    <div className="hidden md:block">
                                        <TrackerRow
                                            opp={opp}
                                            updateStatus={updateStatus}
                                            onClick={setDetailOpp}
                                            onResume={() => setSmartApplyOpp(opp)}
                                            onDelete={removeFromTracker}
                                            onAddCalendar={() => handleAddCalendar(opp)}
                                            onAddTask={() => handleAddTask(opp)}
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

            <AddEventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onAdd={handleEventSubmit}
                initialData={eventInitialData}
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
