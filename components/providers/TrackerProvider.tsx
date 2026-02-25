"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { fetchInternshipsPaginated } from '@/lib/queries-internships';
import { fetchOpportunitiesPaginated } from '@/lib/queries-opportunities';
import { Internship, Opportunity } from '@/types/interfaces';

export interface TrackerItem {
    oppId: number | string;
    status: string; // 'Not Applied' | 'Draft' | 'Applied' | 'Result Awaited' | 'Selected' | 'Rejected'
    kind?: 'internship' | 'opportunity'; // Default to 'internship' if undefined
    addedAt: string;
    appliedAt: string | null;
    result: string | null;
    notes: string;
    updatedAt?: string;
    draftData?: unknown;
    // Merged fields from API
    title?: string;
    company?: string;
    location?: string;
    type?: string;
    deadline?: string;
    logo?: string;
    fit?: string;
    fitColor?: string;
    fitLabel?: string;
    matchReason?: string;
    expectedResultWindow?: string;
    description?: string;
    expectations?: string[];
    eligibility?: string[];
    skills?: string[];
    tags?: string[];
    [key: string]: unknown;
}

export interface ManualTrackerInput extends Omit<Partial<TrackerItem>, 'oppId'> {
    id?: number | string;
    kind?: 'internship' | 'opportunity';
    draftData?: unknown;
}

export interface TrackerEvent {
    id: string; // Changed to string (UUID)
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
    removeEvent: (id: string) => void; // Changed to string
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

    // Initial Load from API with LocalStorage Fallback/Sync
    useEffect(() => {
        const initializeTracker = async () => {
            try {
                // 1. Fetch from API
                const response = await fetch('/api/tracker');

                if (response.ok) {
                    const data = await response.json();

                    // 2. Check if API has data
                    if (data.items && data.items.length > 0) {
                        setTrackedItems(data.items);
                        setEvents(data.events || []);
                        setIsLoaded(true);
                        return; // API is source of truth
                    }
                }

                // 3. Fallback: If API empty (or failed), load from LocalStorage
                const savedItems = localStorage.getItem('tracker_items');
                const savedEvents = localStorage.getItem('tracker_events');

                let localItems: TrackerItem[] = [];
                let localEvents: TrackerEvent[] = [];

                if (savedItems) {
                    try {
                        localItems = JSON.parse(savedItems);
                    } catch (e) {
                        console.error("Failed to parse local tracker_items", e);
                    }
                }

                if (savedEvents) {
                    try {
                        localEvents = JSON.parse(savedEvents);
                    } catch (e) {
                        console.error("Failed to parse local tracker_events", e);
                    }
                }

                // 4. MIGRATION: If we have local data but API was empty, sync to backend
                if ((localItems.length > 0 || localEvents.length > 0) && response.ok) {
                    console.log("Migrating local data to backend...");

                    if (localItems.length > 0) {
                        await fetch('/api/tracker', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'sync_items', data: localItems })
                        });
                    }

                    if (localEvents.length > 0) {
                        await fetch('/api/tracker', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'sync_events', data: localEvents })
                        });
                    }

                    // After sync, setting state from local is fine as it matches backend now
                }

                setTrackedItems(localItems);
                setEvents(localEvents);

            } catch (error) {
                console.error('Failed to initialize tracker:', error);

                try {
                    const savedItems = localStorage.getItem('tracker_items');
                    if (savedItems) setTrackedItems(JSON.parse(savedItems));
                } catch (e) {
                    console.error("Failed to recover from local storage", e);
                }

            } finally {
                setIsLoaded(true);
            }
        };

        initializeTracker();
    }, []);

    // Helper to sync state changes to API (Optimistic updates)
    const syncItemToBackend = async (item: TrackerItem) => {
        try {
            await fetch('/api/tracker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_item', data: item })
            });
        } catch (e) {
            console.error("Failed to sync item", e);
            toast.error("Failed to save changes to cloud");
        }
    };

    const syncStatusToBackend = async (oppId: string | number, status: string, extraData?: Record<string, unknown>) => {
        try {
            await fetch('/api/tracker', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', id: oppId, data: { status, ...extraData } })
            });
        } catch (e) {
            console.error("Failed to sync status", e);
        }
    }

    const deleteFromBackend = async (id: string | number, type: 'item' | 'event') => {
        try {
            await fetch(`/api/tracker?type=${type}&id=${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error("Failed to delete from backend", e);
        }
    }


    // Persistence (Keep LocalStorage as backup/cache)
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

            // Avoid hydration if items are already fully hydrated (unlikely but possible optimization)
            // For now, we always hydrate to get latest company info/logos etc.

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
                const internshipsMap = new Map(internshipData.internships.map((i: Internship) => [i.id, i]));
                const opportunitiesMap = new Map((opportunityData.opportunities || []).map((o: Opportunity) => [o.id, o]));

                // Merge Data
                const merged = trackedItems.map(item => {
                    let apiData: Partial<TrackerItem> = {};

                    if ((item.kind || 'internship') === 'internship') {
                        const fetched = internshipsMap.get(item.oppId as string);
                        if (fetched) {
                            apiData = {
                                title: fetched.title,
                                company: fetched.hiringOrganization,
                                location: fetched.location,
                                type: fetched.type,
                                deadline: fetched.deadline,
                                logo: undefined, // Internship uses 'poster' (was removed)
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

                    if (Object.keys(apiData).length === 0) {
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
                setHydratedItems(trackedItems);
            } finally {
                setIsFetching(false);
            }
        };

        const timeout = setTimeout(fetchDetails, 100);
        return () => clearTimeout(timeout);

    }, [trackedItems, isLoaded]);

    const addEvent = (event: Omit<TrackerEvent, 'id'>) => {
        const optimisticId = Date.now().toString(); // Use string ID
        const newItem = { ...event, id: optimisticId };
        setEvents(prev => [...prev, newItem]);
        toast.success(`📅 Event Added: ${event.title}`);

        // Backend Sync
        fetch('/api/tracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_event', data: event })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.event) {
                    // Update with backend ID
                    setEvents(prev => prev.map(e => e.id === optimisticId ? { ...e, id: data.event.id } : e));
                }
            })
            .catch(err => console.error("Event sync failed", err));
    };

    const removeEvent = (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));
        deleteFromBackend(id, 'event');
    };

    const addToTracker = (oppOrId: number | string | ManualTrackerInput, initialStatus = 'Not Applied', kind: 'internship' | 'opportunity' = 'internship') => {
        const isManual = typeof oppOrId === 'object';
        const idToCheck = isManual
            ? (oppOrId as ManualTrackerInput).id ?? Date.now()
            : (oppOrId as number | string);

        const isAlreadyAdded = trackedItems.some(i => String(i.oppId) === String(idToCheck));

        if (isAlreadyAdded) {
            toast.info("Already in Tracker");
            return;
        }

        if (initialStatus === 'Not Applied') {
            toast.success("Saved to Tracker");
        } else if (initialStatus === 'Draft') {
            toast.success("Draft Saved");
        }

        let newItem: TrackerItem;

        setTrackedItems(prevItems => {
            if (prevItems.some(i => String(i.oppId) === String(idToCheck))) {
                return prevItems;
            }

            const inputData = isManual ? (oppOrId as ManualTrackerInput) : {};

            newItem = {
                oppId: idToCheck,
                status: initialStatus,
                kind: (isManual && (oppOrId as ManualTrackerInput).kind) ? (oppOrId as ManualTrackerInput).kind : kind,
                addedAt: new Date().toISOString(),
                appliedAt: initialStatus === 'Applied' ? new Date().toISOString() : null,
                result: null,
                notes: inputData.notes || '',
                draftData: (isManual && (oppOrId as ManualTrackerInput).draftData) ? (oppOrId as ManualTrackerInput).draftData : null,
                ...inputData
            } as TrackerItem;

            // Trigger sync (side effect inside setter is bad practice usually, but doing it after calculation)
            setTimeout(() => syncItemToBackend(newItem), 0);

            return [...prevItems, newItem];
        });
    };

    const updateStatus = (oppId: number | string, status: string, extraData: Record<string, unknown> = {}) => {
        setTrackedItems(prevItems => prevItems.map(i => {
            if (String(i.oppId) === String(oppId)) { // String comparison
                const updated = {
                    ...i,
                    ...extraData,
                    status,
                    updatedAt: new Date().toISOString()
                };
                return updated;
            }
            return i;
        }));

        syncStatusToBackend(oppId, status, extraData);
    };

    const removeFromTracker = (oppId: number | string) => {
        setTrackedItems(prevItems => prevItems.filter(i => String(i.oppId) !== String(oppId))); // String comparison
        toast.success("Deleted from Tracker");
        deleteFromBackend(oppId, 'item');
    };

    const getStatus = (oppId: number | string) => {
        const item = trackedItems.find(i => String(i.oppId) === String(oppId)); // String comparison
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
