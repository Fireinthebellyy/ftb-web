"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { opportunities, Opportunity } from '@/data/opportunities';
import { toast } from 'sonner';

interface TrackerItem extends Opportunity {
    oppId: number | string;
    status: string; // 'Not Applied' | 'Draft' | 'Applied' | 'Result Awaited' | 'Selected' | 'Rejected'
    addedAt: string;
    appliedAt: string | null;
    result: string | null;
    notes: string;
    updatedAt?: string;
}

interface TrackerEvent {
    id: number;
    title: string;
    date: string;
    type: string;
    description: string;
}

interface TrackerContextType {
    items: TrackerItem[];
    events: TrackerEvent[];
    addToTracker: (oppOrId: number | string | Partial<TrackerItem>, initialStatus?: string) => void;
    removeFromTracker: (oppId: number | string) => void;
    updateStatus: (oppId: number | string, status: string, extraData?: any) => void;
    getStatus: (oppId: number | string) => string | null;
    addEvent: (event: Omit<TrackerEvent, 'id'>) => void;
    removeEvent: (id: number) => void;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const useTracker = () => {
    const context = useContext(TrackerContext);
    if (!context) {
        throw new Error('useTracker must be used within a TrackerProvider');
    }
    return context;
};

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<TrackerItem[]>([]);
    const [events, setEvents] = useState<TrackerEvent[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Load
    useEffect(() => {
        const savedItems = localStorage.getItem('tracker_items');
        const savedEvents = localStorage.getItem('tracker_events');
        if (savedItems) setItems(JSON.parse(savedItems));
        if (savedEvents) setEvents(JSON.parse(savedEvents));
        setIsLoaded(true);
    }, []);

    // Persistence
    useEffect(() => {
        if (isLoaded) localStorage.setItem('tracker_items', JSON.stringify(items));
    }, [items, isLoaded]);

    useEffect(() => {
        if (isLoaded) localStorage.setItem('tracker_events', JSON.stringify(events));
    }, [events, isLoaded]);

    const addEvent = (event: Omit<TrackerEvent, 'id'>) => {
        const newItem = { ...event, id: Date.now() };
        setEvents(prev => [...prev, newItem]);
        toast.success(`📅 Event Added: ${event.title}`);
    };

    const removeEvent = (id: number) => {
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    const addToTracker = (oppOrId: number | string | Partial<TrackerItem>, initialStatus = 'Not Applied') => {
        setItems(prevItems => {
            const isManual = typeof oppOrId === 'object';
            const idToCheck = isManual ? (oppOrId as TrackerItem).id || Date.now() : (oppOrId as number | string);

            const existingItem = prevItems.find(i => i.oppId === idToCheck);

            if (existingItem) {
                if (existingItem.status === 'Draft' && initialStatus !== 'Draft') {
                    return prevItems.map(i => i.oppId === idToCheck ? { ...i, status: initialStatus, appliedAt: new Date().toISOString() } : i);
                }
                if (initialStatus === 'Draft' && isManual && (oppOrId as any).draftData) {
                    return prevItems.map(i => i.oppId === idToCheck ? { ...i, draftData: (oppOrId as any).draftData } : i);
                }
                return prevItems;
            }

            if (initialStatus === 'Not Applied') {
                toast.success("✅ Saved to Tracker");
            } else if (initialStatus === 'Draft') {
                toast.success("💾 Draft Saved");
            }

            // If it's an ID from our static data
            let staticData = {};
            if (!isManual) {
                const found = opportunities.find(o => o.id === oppOrId);
                if (found) staticData = found;
            }

            const newItem: TrackerItem = {
                ...(isManual ? (oppOrId as TrackerItem) : staticData as TrackerItem),
                oppId: idToCheck,
                status: initialStatus,
                addedAt: new Date().toISOString(),
                appliedAt: initialStatus === 'Applied' ? new Date().toISOString() : null,
                result: null,
                notes: '',
                draftData: isManual && (oppOrId as any).draftData ? (oppOrId as any).draftData : null,
            };

            return [...prevItems, newItem];
        });
    };

    const updateStatus = (oppId: number | string, status: string, extraData = {}) => {
        setItems(prevItems => prevItems.map(i => {
            if (i.oppId === oppId) {
                return {
                    ...i,
                    status,
                    ...extraData,
                    updatedAt: new Date().toISOString()
                };
            }
            return i;
        }));
    };

    const removeFromTracker = (oppId: number | string) => {
        setItems(prevItems => prevItems.filter(i => i.oppId !== oppId));
        toast.success("Deleted from Tracker");
    };

    const getStatus = (oppId: number | string) => {
        const item = items.find(i => i.oppId === oppId);
        return item ? item.status : null;
    };

    return (
        <TrackerContext.Provider value={{ items, events, addToTracker, removeFromTracker, updateStatus, getStatus, addEvent, removeEvent }}>
            {children}
        </TrackerContext.Provider>
    );
};
