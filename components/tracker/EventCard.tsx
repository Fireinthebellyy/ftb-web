"use client";

import React from 'react';
import { Calendar, Clock, Video, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackerEvent } from '../providers/TrackerProvider';

interface EventCardProps {
    event: TrackerEvent;
    onDelete: (id: string) => void;
}

export default function EventCard({ event, onDelete }: EventCardProps) {
    const isDeadline = event.type === 'Deadline';
    const isInterview = event.type === 'Interview';

    // Colors based on type
    const getTheme = () => {
        if (isInterview) return 'bg-purple-50 border-purple-200 text-purple-900';
        if (isDeadline) return 'bg-amber-50 border-amber-200 text-amber-900';
        return 'bg-slate-50 border-slate-200 text-slate-900';
    };

    const getIcon = () => {
        if (isInterview) return Video;
        if (isDeadline) return AlertCircle;
        return Calendar;
    };

    const Icon = getIcon();

    return (
        <div className={cn("p-4 rounded-xl border flex items-start gap-4 group relative", getTheme())}>
            <div className={cn("p-2 rounded-lg bg-white/60", isInterview ? "text-purple-600" : isDeadline ? "text-amber-600" : "text-slate-600")}>
                <Icon size={20} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm truncate pr-6">{event.title}</h4>
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs opacity-80 font-medium">
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(event.date).toLocaleDateString()}
                    </div>
                </div>

                {event.description && (
                    <p className="text-xs mt-2 opacity-70 line-clamp-2">{event.description}</p>
                )}
            </div>

            <button
                onClick={() => onDelete(event.id)}
                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-black/5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
                <X size={14} />
            </button>
        </div>
    );
}
