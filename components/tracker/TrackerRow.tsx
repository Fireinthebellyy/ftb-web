import { Clock, AlertCircle, Trash2, ChevronDown, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { TrackerItem } from '@/components/providers/TrackerProvider';

interface TrackerRowProps {
    opp: TrackerItem & { isHighPriority?: boolean };
    updateStatus: (id: number | string, status: string, extraData?: Record<string, unknown>) => void;
    onClick: (opp: TrackerItem) => void;
    onDelete: (id: number | string) => void;

}

export default function TrackerRow({ opp, updateStatus, onClick, onDelete }: TrackerRowProps) {
    return (
        <div
            onClick={() => onClick(opp)}
            className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-4 group cursor-pointer"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {(opp.logo || opp.poster || opp.images?.[0]) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opp.logo || opp.poster || opp.images?.[0]} alt={opp.company} className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-100 p-1" />
                ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-lg">
                        {opp.company ? opp.company.charAt(0) : '?'}
                    </div>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 truncate">{opp.title}</h4>
                        <span className={clsx("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide", opp.fitColor)}>
                            {opp.fitLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                        <span>{opp.company}</span>
                        {opp.deadline && (
                            <span className={clsx("flex items-center gap-1",
                                opp.isHighPriority ? "text-rose-600 font-bold" : ""
                            )}>
                                <Clock size={12} /> {new Date(opp.deadline).toLocaleDateString()}
                            </span>
                        )}
                        {opp.expectedResultWindow && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Calendar size={12} /> Exp: {opp.expectedResultWindow}
                            </span>
                        )}
                        {opp.isHighPriority && (
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                <AlertCircle size={10} /> HIGH PRIORITY
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full md:w-auto mt-2 md:mt-0 flex items-center gap-2">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <select
                        value={opp.status}
                        onChange={(e) => updateStatus(opp.oppId, e.target.value)}
                        className="appearance-none bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer pl-3 pr-8 py-2"
                    >
                        {['Not Applied', 'Applied', 'Result Awaited', 'Selected', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            <div className="flex items-center gap-1">
                {opp.deadline && (
                    <a
                        href={`https://www.google.com/calendar/render?action=TEMPLATE&text=Deadline: ${encodeURIComponent(opp.title)}&dates=${new Date(opp.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(opp.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=Company: ${encodeURIComponent(opp.company)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Add to Google Calendar"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/google-calendar.webp" alt="Google Calendar" className="w-5 h-5 object-contain" />
                    </a>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(opp.oppId); }}
                    className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove from Tracker"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>

    );
}
