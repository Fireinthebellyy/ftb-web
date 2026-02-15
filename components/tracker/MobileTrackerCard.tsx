import React from 'react';
import { AlertCircle, Trash2, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

interface MobileTrackerCardProps {
    opp: any;
    updateStatus: (id: number | string, status: string, extraData?: any) => void;
    onDelete: (id: number | string) => void;
}

export default function MobileTrackerCard({ opp, updateStatus, onDelete }: MobileTrackerCardProps) {
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
        <div className="p-4 border-b border-slate-100 bg-white relative">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 pr-2">
                    {(opp.logo || opp.poster || opp.images?.[0]) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={opp.logo || opp.poster || opp.images?.[0]} alt={opp.company} className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-100 p-0.5" />
                    ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-sm">
                            {opp.company ? opp.company.charAt(0) : '?'}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate pr-2">{opp.title}</h4>
                        <p className="text-slate-500 text-sm font-medium truncate">{opp.company}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 mb-1">
                        {opp.deadline && (
                            <a
                                href={`https://www.google.com/calendar/render?action=TEMPLATE&text=Deadline: ${encodeURIComponent(opp.title)}&dates=${new Date(opp.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(opp.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=Company: ${encodeURIComponent(opp.company)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/google-calendar.png" alt="Google Calendar" className="w-5 h-5 object-contain" />
                            </a>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(opp.oppId); }}
                            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

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


        </div>
    );
}
