"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { fetchInternshipsPaginated } from '@/lib/queries-internships';
import { fetchOpportunitiesPaginated } from '@/lib/queries-opportunities';

export interface TrackerItem {
    oppId: number | string;
    status: string; // 'Not Applied' | 'Draft' | 'Applied' | 'Result Awaited' | 'Selected' | 'Rejected'
    kind?: 'internship' | 'opportunity'; // Default to 'internship' if undefined
    addedAt: string;
    appliedAt: string | null;
    result: string | null;
    notes: string;
    updatedAt?: string;
    draftData?: any;
    // Merged fields from API
    title?: string;
    company?: string;
    location?: string;
    type?: string;
    deadline?: string;
    logo?: string;
    [key: string]: any;
}

export interface ManualTrackerInput extends Omit<Partial<TrackerItem>, 'oppId'> {
    id?: number | string;
    kind?: 'internship' | 'opportunity';
    draftData?: any;
}

export interface TrackerEvent {
    id: number;
    title: string;
    date: string;
    type: string;
    description: string;
}

interface TrackerContextType {
    items: TrackerItem[];
    events: TrackerEvent[];
    addToTracker: (oppOrId: number | string | ManualTrackerInput, initialStatus?: string, kind?: 'internship' | 'opportunity') => void;
    removeFromTracker: (oppId: number | string) => void;
    updateStatus: (oppId: number | string, status: string, extraData?: Record<string, unknown>) => void;
    getStatus: (oppId: number | string) => string | null;
    addEvent: (event: Omit<TrackerEvent, 'id'>) => void;
    removeEvent: (id: number) => void;
    isLoading: boolean;
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
    const [trackedItems, setTrackedItems] = useState<TrackerItem[]>([]);
    const [events, setEvents] = useState<TrackerEvent[]>([]);
    const [hydratedItems, setHydratedItems] = useState<TrackerItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Initial Load from LocalStorage
    useEffect(() => {
        const savedItems = localStorage.getItem('tracker_items');
        const savedEvents = localStorage.getItem('tracker_events');
        if (savedItems) setTrackedItems(JSON.parse(savedItems));
        if (savedEvents) setEvents(JSON.parse(savedEvents));
        setIsLoaded(true);
    }, []);

    // Persistence
    useEffect(() => {
        if (isLoaded) localStorage.setItem('tracker_items', JSON.stringify(trackedItems));
    }, [trackedItems, isLoaded]);

    useEffect(() => {
        if (isLoaded) localStorage.setItem('tracker_events', JSON.stringify(events));
    }, [events, isLoaded]);

    // Hydrate Data from API
    useEffect(() => {
        const fetchDetails = async () => {
            if (!isLoaded || trackedItems.length === 0) {
                setHydratedItems([]);
                return;
            }

            setIsFetching(true);
            try {
                // Separate IDs by kind
                const internshipIds = trackedItems
                    .filter(i => (i.kind || 'internship') === 'internship')
                    .map(i => i.oppId as string);

                const opportunityIds = trackedItems
                    .filter(i => i.kind === 'opportunity' && typeof i.oppId === 'string')
                    .map(i => i.oppId as string);

                // Fetch in parallel
                const [internshipData, opportunityData] = await Promise.all([
                    internshipIds.length > 0 ? fetchInternshipsPaginated(100, 0, undefined, [], [], undefined, undefined, undefined, internshipIds) : Promise.resolve({ internships: [] }),
                    opportunityIds.length > 0 ? fetchOpportunitiesPaginated(100, 0, undefined, [], [], opportunityIds) : Promise.resolve({ opportunities: [] })
                ]);

                // Create lookups
                const internshipsMap = new Map(internshipData.internships.map((i: any) => [i.id, i]));
                const opportunitiesMap = new Map(opportunityData.opportunities.map((o: any) => [o.id, o]));

                // Merge Data
                const merged = trackedItems.map(item => {
                    let apiData: any = {};

                    if ((item.kind || 'internship') === 'internship') {
                        const fetched = internshipsMap.get(item.oppId as string);
                        if (fetched) {
                            apiData = {
                                title: fetched.title,
                                company: fetched.hiringOrganization,
                                location: fetched.location,
                                type: fetched.type,
                                deadline: fetched.deadline,
                                logo: fetched.poster, // Internship uses 'poster'
                                ...fetched
                            };
                        }
                    } else if (item.kind === 'opportunity') {
                        const fetched = opportunitiesMap.get(item.oppId as string);
                        if (fetched) {
                            apiData = {
                                title: fetched.title,
                                company: fetched.organiserInfo || 'Organizer', // Opportunities use organiserInfo
                                location: fetched.location,
                                type: fetched.type,
                                deadline: fetched.endDate || fetched.startDate, // Use endDate as deadline
                                logo: fetched.images?.[0], // Use first image if available
                                ...fetched
                            };
                        }
                    }

                    // Prioritize local overrides (e.g. user edited notes) but prefer API for core fields unless manual
                    // Check if it's a manual ID (numeric timestamp) vs UUID (string)
                    // const isManual = typeof item.oppId === 'number';

                    if (Object.keys(apiData).length === 0) {
                        // Keep item as is if not found in API (might be manual or deleted)
                        return item;
                    }

                    return {
                        ...apiData,
                        ...item, // Keep local status, notes, etc.
                        title: apiData.title || item.title, // Prefer API title
                        company: apiData.company || item.company,
                        logo: apiData.logo || item.logo, // Prefer API logo
                    };
                });

                setHydratedItems(merged);

            } catch (error) {
                console.error("Failed to hydrate tracker items", error);
                // Fallback to local items if fetch fails
                setHydratedItems(trackedItems);
            } finally {
                setIsFetching(false);
            }
        };

        // Debounce fetching slightly to avoid thrashing on rapid adds
        const timeout = setTimeout(fetchDetails, 100);
        return () => clearTimeout(timeout);

    }, [trackedItems, isLoaded]);

    const addEvent = (event: Omit<TrackerEvent, 'id'>) => {
        const newItem = { ...event, id: Date.now() };
        setEvents(prev => [...prev, newItem]);
        toast.success(`📅 Event Added: ${event.title}`);
    };

    const removeEvent = (id: number) => {
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    const addToTracker = (oppOrId: number | string | ManualTrackerInput, initialStatus = 'Not Applied', kind: 'internship' | 'opportunity' = 'internship') => {
        setTrackedItems(prevItems => {
            const isManual = typeof oppOrId === 'object';
            // If manual input, id might be undefined, so generate one. If id/string passed, use it.
            const idToCheck = isManual
                ? (oppOrId as ManualTrackerInput).id ?? Date.now()
                : (oppOrId as number | string);

            const existingItem = prevItems.find(i => i.oppId === idToCheck);

            if (existingItem) {
                toast.info("Already in Tracker");
                return prevItems;
            }

            if (initialStatus === 'Not Applied') {
                toast.success("✅ Saved to Tracker");
            } else if (initialStatus === 'Draft') {
                toast.success("💾 Draft Saved");
            }

            const inputData = isManual ? (oppOrId as ManualTrackerInput) : {};

            const newItem: TrackerItem = {
                oppId: idToCheck,
                status: initialStatus,
                kind: (isManual && (oppOrId as ManualTrackerInput).kind) ? (oppOrId as ManualTrackerInput).kind : kind,
                addedAt: new Date().toISOString(),
                appliedAt: initialStatus === 'Applied' ? new Date().toISOString() : null,
                result: null,
                notes: inputData.notes || '',
                draftData: (isManual && (oppOrId as ManualTrackerInput).draftData) ? (oppOrId as ManualTrackerInput).draftData : null,
                // If it's manual, we might store partial data here too
                ...inputData
            } as TrackerItem;

            return [...prevItems, newItem];
        });
    };

    const updateStatus = (oppId: number | string, status: string, extraData: Record<string, unknown> = {}) => {
        setTrackedItems(prevItems => prevItems.map(i => {
            if (i.oppId === oppId) {
                return {
                    ...i,
                    ...extraData,
                    status,
                    updatedAt: new Date().toISOString()
                };
            }
            return i;
        }));
    };

    const removeFromTracker = (oppId: number | string) => {
        setTrackedItems(prevItems => prevItems.filter(i => i.oppId !== oppId));
        toast.success("Deleted from Tracker");
    };

    const getStatus = (oppId: number | string) => {
        const item = trackedItems.find(i => i.oppId === oppId);
        return item ? item.status : null;
    };

    return (
        <TrackerContext.Provider value={{
            items: hydratedItems.length > 0 ? hydratedItems : trackedItems,
            events,
            addToTracker,
            removeFromTracker,
            updateStatus,
            getStatus,
            addEvent,
            removeEvent,
            isLoading: !isLoaded || isFetching
        }}>
            {children}
        </TrackerContext.Provider>
    );
};
