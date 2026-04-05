"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
// router and toasts removed from provider; UI handles notifications
import { fetchInternshipsPaginated } from "@/lib/queries-internships";
import { fetchOpportunitiesPaginated } from "@/lib/queries-opportunities";
import { Internship, Opportunity } from "@/types/interfaces";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";

export interface TrackerItem {
  oppId: number | string;
  status: string; // 'Not Applied' | 'Draft' | 'Applied' | 'Result Awaited' | 'Selected' | 'Rejected'
  kind?: "internship" | "opportunity"; // Default to 'internship' if undefined
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
  snapshot?: {
    logo?: string;
    poster?: string;
    images?: string[];
  };
  poster?: string;
  images?: string[];
  isArchived?: boolean;
  [key: string]: unknown;
}

export interface ManualTrackerInput extends Omit<
  Partial<TrackerItem>,
  "oppId"
> {
  id?: number | string;
  kind?: "internship" | "opportunity";
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
  addToTracker: (
    oppOrId: number | string | ManualTrackerInput,
    initialStatus?: string,
    kind?: "internship" | "opportunity"
  ) => Promise<boolean>;
  removeFromTracker: (
    oppId: number | string,
    kind?: "internship" | "opportunity"
  ) => Promise<boolean>;
  updateStatus: (
    oppId: number | string,
    status: string,
    extraData?: Record<string, unknown>,
    kind?: "internship" | "opportunity"
  ) => Promise<void>;
  getStatus: (
    oppId: number | string,
    kind?: "internship" | "opportunity"
  ) => string | null;
  addEvent: (event: Omit<TrackerEvent, "id">) => void;
  removeEvent: (id: string) => void; // Changed to string
  isLoading: boolean;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used within a TrackerProvider");
  }
  return context;
};

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
  // router not needed in provider
  const [trackedItems, setTrackedItems] = useState<TrackerItem[]>([]);
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [hydratedItems, setHydratedItems] = useState<TrackerItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const pendingAdds = React.useRef<Set<string>>(new Set());

  // Stable key: only changes when the set of tracked IDs changes (not on status updates)
  const trackedIdKey = useMemo(() => {
    return trackedItems
      .map((i) => `${i.kind || "internship"}:${i.oppId}`)
      .sort()
      .join(",");
  }, [trackedItems]);

  // Ref for latest trackedItems inside effects without re-triggering them
  const trackedItemsRef = useRef<TrackerItem[]>(trackedItems);
  trackedItemsRef.current = trackedItems;

  // Initial load from API with local cache fallback on failures.
  useEffect(() => {
    const initializeTracker = async () => {
      try {
        // 1. Fetch from API
        const response = await fetch("/api/tracker");

        if (response.ok) {
          const data = await response.json();

          setTrackedItems(Array.isArray(data.items) ? data.items : []);
          setEvents(Array.isArray(data.events) ? data.events : []);
          localStorage.removeItem("tracker_items");
          localStorage.removeItem("tracker_events");
          return;
        }

        console.warn("Tracker API request failed; falling back to local cache.");
        const cachedItems = localStorage.getItem("tracker_items");
        const cachedEvents = localStorage.getItem("tracker_events");

        const parsedItems = cachedItems ? JSON.parse(cachedItems) : [];
        const parsedEvents = cachedEvents ? JSON.parse(cachedEvents) : [];

        setTrackedItems(Array.isArray(parsedItems) ? parsedItems : []);
        setEvents(Array.isArray(parsedEvents) ? parsedEvents : []);
      } catch (error) {
        console.error("Failed to initialize tracker:", error);
        try {
          const cachedItems = localStorage.getItem("tracker_items");
          const cachedEvents = localStorage.getItem("tracker_events");
          const parsedItems = cachedItems ? JSON.parse(cachedItems) : [];
          const parsedEvents = cachedEvents ? JSON.parse(cachedEvents) : [];

          setTrackedItems(Array.isArray(parsedItems) ? parsedItems : []);
          setEvents(Array.isArray(parsedEvents) ? parsedEvents : []);
        } catch {
          setTrackedItems([]);
          setEvents([]);
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
      await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_item", data: item }),
      });
    } catch (e) {
      console.error("Failed to sync item", e);
    }
  };

  const syncStatusToBackend = async (
    oppId: string | number,
    status: string,
    extraData?: Record<string, unknown>,
    kind?: "internship" | "opportunity"
  ) => {
    try {
      await fetch("/api/tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          id: oppId,
          kind: resolveTrackerKind(kind),
          data: { status, extraData },
        }),
      });
    } catch (e) {
      console.error("Failed to sync status", e);
    }
  };

  const deleteFromBackend = async (
    id: string | number,
    type: "item" | "event",
    kind?: "internship" | "opportunity"
  ): Promise<boolean> => {
    try {
      const params = new URLSearchParams({ type, id: String(id) });
      if (type === "item") {
        params.set("kind", resolveTrackerKind(kind));
      }

      const res = await fetch(`/api/tracker?${params.toString()}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to delete from backend", await res.text());
        return false;
      }
      return true;
    } catch (e) {
      console.error("Failed to delete from backend", e);
      return false;
    }
  };

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("tracker_items", JSON.stringify(trackedItems));
    }
  }, [trackedItems, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("tracker_events", JSON.stringify(events));
    }
  }, [events, isLoaded]);

  // Hydrate Data from API
  useEffect(() => {
    const fetchDetails = async () => {
      const currentItems = trackedItemsRef.current;
      if (!isLoaded || currentItems.length === 0) {
        setHydratedItems([]);
        return;
      }

      // Avoid hydration if items are already fully hydrated (unlikely but possible optimization)
      // For now, we always hydrate to get latest company info/logos etc.

      setIsFetching(true);
      try {
        const isExpired = (deadline?: string) => {
          if (!deadline) return false;
          try {
            const d = new Date(deadline);
            if (isNaN(d.getTime())) return false;
            const today = new Date();
            // Using a 3-day grace period to ensure we catch last-minute changes but skip truly old ones
            const cutoff = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
            return d < cutoff;
          } catch {
            return false;
          }
        };

        // Separate IDs by kind, skipping items already known to be expired
        const internshipIds = currentItems
          .filter(
            (i) =>
              (i.kind || "internship") === "internship" && !isExpired(i.deadline)
          )
          .map((i) => i.oppId as string);

        const opportunityIds = currentItems
          .filter(
            (i) =>
              i.kind === "opportunity" &&
              typeof i.oppId === "string" &&
              !isExpired(i.deadline)
          )
          .map((i) => i.oppId as string);

        // Fetch in parallel
        const [internshipData, opportunityData] = await Promise.all([
          internshipIds.length > 0
            ? fetchInternshipsPaginated(
                100,
                0,
                undefined,
                [],
                [],
                undefined,
                undefined,
                undefined,
                internshipIds
              )
            : Promise.resolve({ internships: [] }),
          opportunityIds.length > 0
            ? fetchOpportunitiesPaginated(
                100,
                0,
                undefined,
                [],
                [],
                opportunityIds
              )
            : Promise.resolve({ opportunities: [] }),
        ]);

        // Create lookups
        const internshipsMap = new Map(
          internshipData.internships.map((i: Internship) => [i.id, i])
        );
        const opportunitiesMap = new Map(
          (opportunityData.opportunities || []).map((o: Opportunity) => [
            o.id,
            o,
          ])
        );

        const getImageUrl = (
          imageId: string | undefined
        ): string | undefined => {
          if (!imageId) return undefined;
          if (imageId.startsWith("http") || imageId.startsWith("/"))
            return imageId;
          return tryGetStoragePublicUrl("opportunity-images", imageId);
        };

        // Merge Data
        const merged = currentItems.map((item) => {
          let apiData: Partial<TrackerItem> = {};

          if ((item.kind || "internship") === "internship") {
            const fetched = internshipsMap.get(item.oppId as string);
            if (fetched) {
              apiData = {
                ...fetched,
                title: fetched.title,
                company: fetched.hiringOrganization,
                location: fetched.location,
                type: fetched.type,
                deadline: fetched.deadline,
                logo: undefined,
              };
            }
          } else if (item.kind === "opportunity") {
            const fetched = opportunitiesMap.get(item.oppId as string);
            if (fetched) {
              apiData = {
                ...fetched,
                title: fetched.title,
                company: fetched.organiserInfo || "Organizer", // Opportunities use organiserInfo
                location: fetched.location,
                type: fetched.type,
                deadline: fetched.startDate || fetched.endDate, // Prefer startDate as deadline
                logo: getImageUrl(fetched.images?.[0]), // Use first image if available, resolving to URL
              };
            }
          }

          const snapshotTitle =
            typeof item.title === "string" ? item.title.trim() : "";
          const snapshotCompany =
            typeof item.company === "string" ? item.company.trim() : "";
          const snapshotLogo =
            typeof item.logo === "string" ? item.logo.trim() : "";

          if (Object.keys(apiData).length === 0) {
            return {
              ...item,
              title:
                snapshotTitle ||
                (item.kind === "opportunity"
                  ? "Archived opportunity"
                  : "Archived internship"),
              company: snapshotCompany || "Source unavailable",
              logo: snapshotLogo || undefined,
              deadline: item.deadline, // Use from state
              isArchived: true,
            };
          }

          // Backfill snapshotDeadline if missing or different in DB record
          if (apiData.deadline && apiData.deadline !== item.deadline) {
            // Background sync (fire and forget)
            syncStatusToBackend(
              item.oppId,
              item.status,
              { deadline: apiData.deadline },
              item.kind
            );
          }

          return {
            ...item, // Keep local status, notes, etc.
            ...apiData, // API data overrides stale local data
            title: apiData.title || snapshotTitle || item.title, // Prefer API title
            company: apiData.company || snapshotCompany || item.company,
            logo: apiData.logo || snapshotLogo || item.logo, // Prefer API logo
            isArchived: false,
          };
        });

        setHydratedItems(merged);
      } catch (error) {
        console.error("Failed to hydrate tracker items", error);
        setHydratedItems(trackedItemsRef.current);
      } finally {
        setIsFetching(false);
      }
    };

    const timeout = setTimeout(fetchDetails, 100);
    return () => clearTimeout(timeout);
  }, [trackedIdKey, isLoaded]);

  const addEvent = (event: Omit<TrackerEvent, "id">) => {
    const optimisticId = Date.now().toString(); // Use string ID
    const newItem = { ...event, id: optimisticId };
    setEvents((prev) => [...prev, newItem]);
    // UI should handle notifications for events

    // Backend Sync
    fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_event", data: event }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.event) {
          // Update with backend ID
          setEvents((prev) =>
            prev.map((e) =>
              e.id === optimisticId ? { ...e, id: data.event.id } : e
            )
          );
        }
      })
      .catch((err) => console.error("Event sync failed", err));
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    deleteFromBackend(id, "event");
  };

  const addToTracker = async (
    oppOrId: number | string | ManualTrackerInput,
    initialStatus = "Not Applied",
    kind: "internship" | "opportunity" = "internship"
  ): Promise<boolean> => {
    const isManual = typeof oppOrId === "object";
    const idToCheck = isManual
      ? ((oppOrId as ManualTrackerInput).id ?? Date.now())
      : (oppOrId as number | string);
    const effectiveKind =
      isManual && (oppOrId as ManualTrackerInput).kind
        ? (oppOrId as ManualTrackerInput).kind
        : kind;
    const nextKey = getTrackerKey(idToCheck, effectiveKind);

    // Prevent duplicate concurrent adds for same key
    if (pendingAdds.current.has(nextKey)) return false;

    const isAlreadyAdded = trackedItems.some(
      (i) => getTrackerKey(i.oppId, i.kind) === nextKey
    );

    if (isAlreadyAdded) {
      // caller should show "Already in Tracker" if desired
      return false;
    }

    // mark pending
    pendingAdds.current.add(nextKey);

    const inputData = isManual ? (oppOrId as ManualTrackerInput) : {};
    const newItem = {
      oppId: idToCheck,
      status: initialStatus,
      kind: effectiveKind,
      addedAt: new Date().toISOString(),
      appliedAt: initialStatus === "Applied" ? new Date().toISOString() : null,
      result: null,
      notes: inputData.notes || "",
      draftData:
        isManual && (oppOrId as ManualTrackerInput).draftData
          ? (oppOrId as ManualTrackerInput).draftData
          : null,
      ...inputData,
    } as TrackerItem;

    // Optimistically Update state
    setTrackedItems((prevItems) => [...prevItems, newItem]);

    // Backend Sync
    try {
      await syncItemToBackend(newItem);
      return true;
    } catch (error) {
      console.error("Optimistic add failed, reverting:", error);
      setTrackedItems((prevItems) =>
        prevItems.filter((i) => getTrackerKey(i.oppId, i.kind) !== nextKey)
      );
      return false;
    } finally {
      pendingAdds.current.delete(nextKey);
    }
  };

  const updateStatus = async (
    oppId: number | string,
    status: string,
    extraData: Record<string, unknown> = {},
    kind?: "internship" | "opportunity"
  ): Promise<void> => {
    const targetKey = getTrackerKey(oppId, kind);

    // Optimistic update
    setTrackedItems((prevItems) =>
      prevItems.map((i) => {
        if (getTrackerKey(i.oppId, i.kind) === targetKey) {
          const updated = {
            ...i,
            ...extraData,
            status,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return i;
      })
    );

    await syncStatusToBackend(oppId, status, extraData, kind);
  };

  const removeFromTracker = async (
    oppId: number | string,
    kind?: "internship" | "opportunity"
  ): Promise<boolean> => {
    const targetKey = getTrackerKey(oppId, kind);

    // Snapshot current state so we can revert on failure
    const prevTracked = trackedItems;
    const prevHydrated = hydratedItems;

    // Compute optimistic new states
    const newTracked = prevTracked.filter(
      (i) => getTrackerKey(i.oppId, i.kind) !== targetKey
    );
    const newHydrated = prevHydrated.filter(
      (i) => getTrackerKey(i.oppId, i.kind) !== targetKey
    );

    // Optimistic remove
    setTrackedItems(newTracked);
    setHydratedItems(newHydrated);

    // Attempt backend deletion and revert on failure
    try {
      const success = await deleteFromBackend(oppId, "item", kind);
      if (!success) {
        // Revert optimistic update
        setTrackedItems(prevTracked);
        setHydratedItems(prevHydrated);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Unexpected error while deleting tracker item:", e);
      setTrackedItems(prevTracked);
      setHydratedItems(prevHydrated);
      return false;
    }
  };

  const getStatus = (
    oppId: number | string,
    kind?: "internship" | "opportunity"
  ) => {
    const targetKey = getTrackerKey(oppId, kind);
    const item = trackedItems.find(
      (i) => getTrackerKey(i.oppId, i.kind) === targetKey
    );
    return item ? item.status : null;
  };

  // Compute final items: hydrated data overlaid with latest local status
  const contextItems = useMemo(() => {
    if (hydratedItems.length === 0) return trackedItems;

    const latestMap = new Map(
      trackedItems.map((t) => [getTrackerKey(t.oppId, t.kind), t])
    );
    const hydratedKeys = new Set(
      hydratedItems.map((h) => getTrackerKey(h.oppId, h.kind))
    );

    // Overlay latest local status/notes onto hydrated items
    const merged = hydratedItems.map((h) => {
      const key = getTrackerKey(h.oppId, h.kind);
      const latest = latestMap.get(key);
      if (!latest) return h;
      return {
        ...h,
        status: latest.status,
        notes: latest.notes,
        appliedAt: latest.appliedAt,
        result: latest.result,
        updatedAt: latest.updatedAt,
      };
    });

    // Include newly-added items not yet in hydratedItems
    const newItems = trackedItems.filter(
      (t) => !hydratedKeys.has(getTrackerKey(t.oppId, t.kind))
    );

    return [...merged, ...newItems];
  }, [hydratedItems, trackedItems]);

  return (
    <TrackerContext.Provider
      value={{
        items: contextItems,
        events,
        addToTracker,
        removeFromTracker,
        updateStatus,
        getStatus,
        addEvent,
        removeEvent,
        isLoading: !isLoaded || isFetching,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};
const resolveTrackerKind = (
  kind?: "internship" | "opportunity"
): "internship" | "opportunity" => kind ?? "internship";

const getTrackerKey = (
  oppId: number | string,
  kind?: "internship" | "opportunity"
) => `${resolveTrackerKind(kind)}:${String(oppId)}`;
