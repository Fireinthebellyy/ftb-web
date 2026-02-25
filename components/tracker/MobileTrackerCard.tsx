import React from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { TrackerItem } from '@/components/providers/TrackerProvider';
import { differenceInCalendarDays } from 'date-fns';

function DeadlineBadge({ deadline }: { deadline: string }) {
    const daysDiff = differenceInCalendarDays(new Date(deadline), new Date());
    if (daysDiff < 0) return <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">Closed</span>;
    if (daysDiff === 0) return <span className="text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full animate-pulse">Today!</span>;
    if (daysDiff <= 3) return <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">{daysDiff}d left</span>;
    if (daysDiff <= 7) return <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">{daysDiff} days left</span>;
    return <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">{daysDiff} days left</span>;
}

interface MobileTrackerCardProps {
    opp: TrackerItem;
    updateStatus: (id: number | string, status: string, extraData?: Record<string, unknown>) => void;
    onDelete: (id: number | string) => void;
    onClick: (opp: TrackerItem) => void;
}

export default function MobileTrackerCard({ opp, updateStatus, onDelete, onClick }: MobileTrackerCardProps) {
    const statuses = ['Not Applied', 'Applied', 'Result Awaited', 'Selected', 'Rejected'];

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        if (newStatus === 'Rejected') {
            const reason = prompt("What do you think was the reason? (Resume, Interview, Ghosted?)");
            if (reason) {
                updateStatus(opp.oppId, newStatus, { failureReason: reason });
                toast.message("💡 Suggestion", {
                    description: reason.toLowerCase().includes('resume') ? "Check out the Resume Toolkit." : "Try the Mock Interview tool.",
                });
            } else {
                updateStatus(opp.oppId, newStatus);
            }
        } else {
            updateStatus(opp.oppId, newStatus);
        }
    };

    return (
        <div
            onClick={() => onClick(opp)}
            className="p-4 border-b border-slate-100 bg-white relative cursor-pointer active:bg-slate-50 transition-colors group"
        >
            {/* Top Row: Logo, Info, and Delete */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 pr-2 min-w-0 flex-1">
                    {(opp.logo || opp.poster || opp.images?.[0]) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={opp.logo || opp.poster || opp.images?.[0]} alt={opp.company} className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-100 p-0.5 shrink-0" />
                    ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                            {opp.company ? opp.company.charAt(0) : '?'}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-base leading-tight mb-0.5 truncate pr-1">{opp.title}</h4>
                        <p className="text-slate-500 text-xs font-medium truncate">{opp.company}</p>
                    </div>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(opp.oppId); }}
                    className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                    title="Delete"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Bottom Row: Status and Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
                <div className="relative flex-1 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                    <select
                        value={opp.status}
                        onChange={handleStatusChange}
                        className="appearance-none bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer w-full py-2 px-3 pr-8 transition-all"
                    >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {opp.deadline && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
                            <a
                                href={`https://www.google.com/calendar/render?action=TEMPLATE&text=Deadline: ${encodeURIComponent(opp.title)}&dates=${new Date(opp.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(opp.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=Company: ${encodeURIComponent(opp.company)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                                title="Add to Google Calendar"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/google-calendar.webp" alt="Google Calendar" className="w-4 h-4 object-contain" />
                            </a>
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-600 whitespace-nowrap">
                                {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {opp.kind === 'opportunity' && <DeadlineBadge deadline={opp.deadline} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
