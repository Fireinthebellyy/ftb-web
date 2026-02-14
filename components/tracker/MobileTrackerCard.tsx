import React from 'react';
import { AlertCircle, Trash2, ChevronDown, CalendarPlus, CheckSquare } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

interface MobileTrackerCardProps {
    opp: any;
    updateStatus: (id: number | string, status: string, extraData?: any) => void;
    onDelete: (id: number | string) => void;
    onAddCalendar: () => void;
    onAddTask: () => void;
}

export default function MobileTrackerCard({ opp, updateStatus, onDelete, onAddCalendar, onAddTask }: MobileTrackerCardProps) {
    const statuses = ['Not Applied', 'Draft', 'Applied', 'Result Awaited', 'Selected', 'Rejected'];

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
        <div className="p-4 border-b border-slate-100 bg-white relative">
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(opp.oppId); }}
                className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 p-1"
            >
                <Trash2 size={16} />
            </button>

            <div className="flex justify-between items-start mb-4 pr-6">
                <div className="flex items-center gap-3">
                    {opp.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={opp.logo} alt={opp.company} className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-100 p-0.5" />
                    ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-sm">
                            {opp.company ? opp.company.charAt(0) : '?'}
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{opp.title}</h4>
                        <p className="text-slate-500 text-sm font-medium">{opp.company}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={clsx(
                        "px-2 py-1 border rounded-md text-[10px] uppercase font-bold tracking-wide flex items-center gap-1",
                        opp.isHighPriority ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}>
                        {opp.isHighPriority && <AlertCircle size={10} />}
                        {opp.deadline ? `Due ${new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    </span>

                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <select
                            value={opp.status}
                            onChange={handleStatusChange}
                            className="appearance-none bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer w-32 py-1.5 px-2"
                        >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-4">


                {/* 1. Add to Cal */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddCalendar(); }}
                    className="flex flex-1 flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CalendarPlus size={16} />
                    </div>
                    <span className="text-[10px] font-bold">Add Cal</span>
                </button>

                {/* 2. Add Task */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddTask(); }}
                    className="flex flex-1 flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <CheckSquare size={16} />
                    </div>
                    <span className="text-[10px] font-bold">Add Task</span>
                </button>

                {/* 3. Fit Score */}
                <div className="flex flex-1 flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 text-slate-600">
                    <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2",
                        (opp.fitScore || 0) >= 80 ? "border-emerald-500 text-emerald-700 bg-emerald-50" :
                            (opp.fitScore || 0) >= 50 ? "border-amber-500 text-amber-700 bg-amber-50" :
                                "border-rose-500 text-rose-700 bg-rose-50"
                    )}>
                        {opp.fitScore || 0}
                    </div>
                    <span className="text-[10px] font-bold">Fit Score</span>
                </div>


            </div>
        </div>
    );
}
