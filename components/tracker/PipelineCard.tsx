import React from 'react';
import { Calendar, Trash2, Rocket, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface PipelineCardProps {
    opp: any;
    updateStatus: (id: number, status: string, extraData?: any) => void;
    _triggerNotification?: (msg: any) => void;
    onClick: (opp: any) => void;
    onResume: () => void;
    onDelete: (id: number) => void;
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Not Applied': return 'bg-slate-400';
        case 'Draft': return 'bg-amber-400';
        case 'Applied': return 'bg-blue-500';
        case 'Result Awaited': return 'bg-orange-500';
        case 'Selected': return 'bg-emerald-500';
        case 'Rejected': return 'bg-rose-500';
        default: return 'bg-slate-400';
    }
}

export default function PipelineCard({ opp, updateStatus, _triggerNotification, onClick, onResume, onDelete }: PipelineCardProps) {
    return (
        <div
            onClick={() => onClick(opp)}
            className={clsx(
                "bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group",
                opp.isHighPriority ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"
            )}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(opp.oppId); }}
                className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all z-20"
                title="Remove"
            >
                <Trash2 size={14} />
            </button>
            {opp.isHighPriority && (
                <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-sm z-10">
                    <AlertCircle size={12} />
                </div>
            )}
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400">{opp.company}</span>
                <span className={clsx("w-2 h-2 rounded-full", getStatusColor(opp.status))}></span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">{opp.title}</h4>

            {opp.expectedResultWindow && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-2">
                    <Calendar size={10} />
                    <span>Expected: {opp.expectedResultWindow}</span>
                </div>
            )}

            <div className="flex items-center justify-between mt-2">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <select
                        value={opp.status}
                        onChange={(e) => updateStatus(opp.oppId, e.target.value)}
                        className="appearance-none bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer w-full py-1.5 px-2"
                    >
                        {['Not Applied', 'Draft', 'Applied', 'Result Awaited', 'Selected', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {opp.status === 'Draft' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onResume(); }}
                        className="p-1 text-amber-500 hover:bg-amber-50 rounded"
                        title="Resume Draft"
                    >
                        <Rocket size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
