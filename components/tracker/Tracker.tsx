"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useTracker,
  TrackerItem,
} from "@/components/providers/TrackerProvider";
import {
  FileText,
  TrendingUp,
  LucideIcon,
  Loader2,
  Activity,
  CalendarCog,
  ChevronRight,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

import TrackerDetailModal from "./TrackerDetailModal";
import ApplyModal, { ApplyModalOpportunity } from "./ApplyModal";

import TrackerRow from "./TrackerRow";
import MobileTrackerCard from "./MobileTrackerCard";

interface EnrichedTrackerItem extends TrackerItem {
  isHighPriority: boolean;
}

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  highlight?: boolean;
}

interface CalendarReminderSettings {
  weekBefore: boolean;
  dayBefore: boolean;
  hourBefore: boolean;
}

export default function Tracker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Helper for Priority
  const isHighPriority = (deadline?: string) => {
    if (!deadline) return false;
    const diff = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return diff >= 0 && diff <= 7;
  };

  const { items, updateStatus, removeFromTracker, isLoading } = useTracker();

  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "opportunity" || tabParam === "internship"
      ? tabParam
      : "internship";
  const [activeTab, setActiveTab] = useState<"internship" | "opportunity">(
    initialTab
  );

  useEffect(() => {
    if (searchParams.get("calendar") === "connected") {
      toast.success(
        "Google Calendar connected. You can now add events in one click."
      );
      setIsCalendarConnected(true);
      loadCalendarConfig();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("calendar");
      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false }
      );
    }
  }, [pathname, router, searchParams]);

  // Sync tab to URL when changed
  const handleTabChange = (tab: "internship" | "opportunity") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [detailOpp, setDetailOpp] = useState<TrackerItem | null>(null);
  const [smartApplyOpp, setSmartApplyOpp] = useState<TrackerItem | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [isCalendarConfigLoading, setIsCalendarConfigLoading] = useState(true);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isSavingCalendarSettings, setIsSavingCalendarSettings] =
    useState(false);
  const [calendarReminderSettings, setCalendarReminderSettings] =
    useState<CalendarReminderSettings>({
      weekBefore: true,
      dayBefore: true,
      hourBefore: true,
    });
  const [calendarAddedByKey, setCalendarAddedByKey] = useState<
    Record<string, boolean>
  >({});
  const [calendarAddingByKey, setCalendarAddingByKey] = useState<
    Record<string, boolean>
  >({});

  const getCalendarKey = (opp: TrackerItem) =>
    `${opp.oppId}:${opp.deadline || ""}`;

  const loadCalendarConfig = async () => {
    try {
      setIsCalendarConfigLoading(true);
      const response = await fetch("/api/tracker/calendar", {
        method: "GET",
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return;
      }

      setIsCalendarConnected(!!data?.connected);
      if (data?.reminders) {
        setCalendarReminderSettings({
          weekBefore: !!data.reminders.weekBefore,
          dayBefore: !!data.reminders.dayBefore,
          hourBefore: !!data.reminders.hourBefore,
        });
      }
    } catch (error) {
      console.error("Failed to load calendar config", error);
    } finally {
      setIsCalendarConfigLoading(false);
    }
  };

  const updateCalendarReminderSetting = async (
    key: keyof CalendarReminderSettings,
    checked: boolean
  ) => {
    const previousSettings = calendarReminderSettings;
    const nextSettings = {
      ...calendarReminderSettings,
      [key]: checked,
    };

    setCalendarReminderSettings(nextSettings);
    setIsSavingCalendarSettings(true);

    try {
      const response = await fetch("/api/tracker/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });

      if (!response.ok) {
        setCalendarReminderSettings(previousSettings);
        toast.error("Failed to save calendar notification settings.");
      }
    } catch (error) {
      console.error("Failed to update calendar reminder settings", error);
      setCalendarReminderSettings(previousSettings);
      toast.error("Failed to save calendar notification settings.");
    } finally {
      setIsSavingCalendarSettings(false);
    }
  };

  useEffect(() => {
    loadCalendarConfig();
  }, []);

  // Hydrate & Enhance Logic
  const filteredItems = items.filter(
    (i) => (i.kind || "internship") === activeTab
  );

  const trackedOpps = useMemo(() => {
    return filteredItems.map((item) => {
      // Data is already hydrated in Provider, just calculate priority
      // For manual items that might miss some fields, we handle gracefully

      return {
        ...item,
        isHighPriority: isHighPriority(item.deadline),
      } as EnrichedTrackerItem;
    });
  }, [filteredItems]);

  // Metrics Calculation
  const total = trackedOpps.length;

  // Total Applied: Everything where status is NOT 'Not Applied' and NOT 'Draft'
  const totalApplications = trackedOpps.filter(
    (i) => i.status !== "Not Applied" && i.status !== "Draft"
  ).length;
  const totalSelected = trackedOpps.filter(
    (i) => i.status === "Selected"
  ).length;

  const successRate =
    totalApplications > 0
      ? Math.round((totalSelected / totalApplications) * 100)
      : 0;
  const actionRate =
    total > 0 ? Math.round((totalApplications / total) * 100) : 0;

  const connectGoogleCalendar = async () => {
    try {
      setIsConnectingCalendar(true);
      await authClient.linkSocial({
        provider: "google",
        callbackURL: "/tracker?calendar=connected",
        scopes: ["https://www.googleapis.com/auth/calendar.events"],
      });
    } catch (error) {
      console.error("Failed to connect Google Calendar", error);
      toast.error("Could not connect Google Calendar. Please try again.");
      setIsConnectingCalendar(false);
    }
  };

  const addToGoogleCalendar = async (opp: TrackerItem) => {
    if (!opp.deadline) {
      toast.error("This item has no deadline to create a calendar event.");
      return;
    }

    const key = getCalendarKey(opp);
    setCalendarAddingByKey((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch("/api/tracker/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oppId: String(opp.oppId),
          title: opp.title || "Untitled Opportunity",
          company: opp.company || "Unknown Company",
          deadline: opp.deadline,
          kind: opp.kind || "internship",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.code === "GOOGLE_CALENDAR_NOT_CONNECTED") {
          setIsCalendarConnected(false);
          toast.error(
            "Connect Google Calendar first from the tracker header button."
          );
          return;
        }
        if (data?.code === "GOOGLE_CALENDAR_SCOPE_MISSING") {
          toast.error(
            "Calendar permission missing. Reconnect Google Calendar from the tracker header button."
          );
          return;
        }
        toast.error(data?.error || "Failed to add event to Google Calendar.");
        return;
      }

      if (data?.alreadyExists) {
        setIsCalendarConnected(true);
        setCalendarAddedByKey((prev) => ({ ...prev, [key]: true }));
        toast.message("This deadline is already in your Google Calendar.");
        return;
      }

      setIsCalendarConnected(true);
      setCalendarAddedByKey((prev) => ({ ...prev, [key]: true }));
      toast.success("Added to Google Calendar.");
    } catch (error) {
      console.error("Failed to add tracker event to Google Calendar", error);
      toast.error("Failed to add event to Google Calendar.");
    } finally {
      setCalendarAddingByKey((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 p-4 pb-20 duration-500 md:p-8">
      {/* Header & Metrics */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Personal Tracker
          </h2>
          <p className="text-slate-500">
            Track, Manage, and Optimize your {activeTab} search.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          {/* Tab Switcher */}
          <div className="flex items-center justify-center rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => handleTabChange("internship")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold transition-all",
                activeTab === "internship"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Internships
            </button>
            <button
              onClick={() => handleTabChange("opportunity")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold transition-all",
                activeTab === "opportunity"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Opportunities
            </button>
          </div>

          {isCalendarConfigLoading ? (
            <button
              type="button"
              disabled
              className="rounded-md border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-500"
            >
              Loading Calendar...
            </button>
          ) : isCalendarConnected ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <CalendarCog size={14} /> Calendar Config
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Reminder Notifications
                  </h4>
                  <p className="text-xs text-slate-500">
                    Controls for new tracker events added to Google Calendar.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        1 Week Before
                      </p>
                      <p className="text-xs text-slate-500">
                        10080 minutes before deadline
                      </p>
                    </div>
                    <Switch
                      checked={calendarReminderSettings.weekBefore}
                      onCheckedChange={(checked) =>
                        updateCalendarReminderSetting("weekBefore", checked)
                      }
                      disabled={isSavingCalendarSettings}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        1 Day Before
                      </p>
                      <p className="text-xs text-slate-500">
                        1440 minutes before deadline
                      </p>
                    </div>
                    <Switch
                      checked={calendarReminderSettings.dayBefore}
                      onCheckedChange={(checked) =>
                        updateCalendarReminderSetting("dayBefore", checked)
                      }
                      disabled={isSavingCalendarSettings}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        1 Hour Before
                      </p>
                      <p className="text-xs text-slate-500">
                        60 minutes before deadline
                      </p>
                    </div>
                    <Switch
                      checked={calendarReminderSettings.hourBefore}
                      onCheckedChange={(checked) =>
                        updateCalendarReminderSetting("hourBefore", checked)
                      }
                      disabled={isSavingCalendarSettings}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <button
              type="button"
              onClick={connectGoogleCalendar}
              disabled={isConnectingCalendar}
              className="rounded-md border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConnectingCalendar
                ? "Connecting..."
                : "Connect Google Calendar"}
            </button>
          )}
        </div>
      </div>

      {/* Insights Toggle Bar */}
      {!showInsights && (
        <button
          onClick={() => setShowInsights(true)}
          className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition-all hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2 transition-transform group-hover:scale-110">
              <TrendingUp size={20} className="text-slate-600" />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold">Check Insights</span>
              <p className="text-sm text-slate-500">
                View your success rate and tracking progress
              </p>
            </div>
          </div>
          <ChevronRight
            size={24}
            className="text-slate-400 transition-transform group-hover:translate-x-1"
          />
        </button>
      )}

      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6 overflow-hidden"
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <TrendingUp className="text-orange-500" size={20} />
                Tracking Insights
              </h3>
              <button
                onClick={() => setShowInsights(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title="Close Insights"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Metrics Card (Consolidated) */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:hidden">
              <div className="relative z-10 mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{total}</h3>
                  <p className="text-sm text-slate-500">Total Tracked</p>
                </div>
                <div className="text-right">
                  <h3 className="text-2xl font-bold text-emerald-600">
                    {successRate}%
                  </h3>
                  <p className="text-sm text-slate-500">Success Rate</p>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {actionRate}%
                  </h4>
                  <p className="text-xs text-slate-500">Action Rate</p>
                </div>
              </div>
            </div>

            {/* Desktop Metrics Grid */}
            <div className="hidden grid-cols-1 gap-6 md:grid md:grid-cols-3">
              <MetricCard
                icon={FileText}
                label="Total Tracked"
                value={total}
                color="bg-slate-100 text-slate-700"
              />
              <MetricCard
                icon={TrendingUp}
                label="Success Rate"
                value={`${successRate}%`}
                color="bg-emerald-50 text-emerald-700"
              />
              <MetricCard
                icon={Activity}
                label="Action Rate"
                value={`${actionRate}%`}
                color="bg-blue-50 text-blue-700"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Content */}
      <div className="space-y-8">
        {/* Main List */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="sticky top-0 z-20 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white/95 p-4 backdrop-blur-md md:p-5">
            <h3 className="shrink-0 text-sm font-bold text-slate-900 md:text-lg">
              Saved{" "}
              {activeTab === "internship" ? "Internships" : "Opportunities"}
            </h3>
            <Link
              href="/toolkit"
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow-orange-200 md:text-sm"
            >
              <Zap size={14} className="fill-white" />
              <span>10x Chances</span>
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {trackedOpps
              .sort((a, b) => {
                const dateA = a.deadline
                  ? new Date(a.deadline).getTime()
                  : 9999999999999;
                const dateB = b.deadline
                  ? new Date(b.deadline).getTime()
                  : 9999999999999;
                return dateA - dateB;
              })
              .map((opp) => (
                <div key={opp.oppId}>
                  <div className="md:hidden">
                    <MobileTrackerCard
                      opp={opp}
                      updateStatus={updateStatus}
                      onDelete={removeFromTracker}
                      onAddToCalendar={addToGoogleCalendar}
                      isCalendarAdded={
                        !!opp.calendarEventId ||
                        !!calendarAddedByKey[getCalendarKey(opp)]
                      }
                      isCalendarAdding={
                        !!calendarAddingByKey[getCalendarKey(opp)]
                      }
                      onClick={(o) => {
                        const path =
                          (o.kind || "internship") === "internship"
                            ? `/intern/${o.oppId}`
                            : `/opportunities/${o.oppId}`;
                        router.push(path);
                      }}
                    />
                  </div>
                  <div className="hidden md:block">
                    <TrackerRow
                      opp={opp}
                      updateStatus={updateStatus}
                      onDelete={removeFromTracker}
                      onAddToCalendar={addToGoogleCalendar}
                      isCalendarAdded={
                        !!opp.calendarEventId ||
                        !!calendarAddedByKey[getCalendarKey(opp)]
                      }
                      isCalendarAdding={
                        !!calendarAddingByKey[getCalendarKey(opp)]
                      }
                      onClick={(o) => {
                        const path =
                          (o.kind || "internship") === "internship"
                            ? `/intern/${o.oppId}`
                            : `/opportunities/${o.oppId}`;
                        router.push(path);
                      }}
                    />
                  </div>
                </div>
              ))}
            {trackedOpps.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No applications tracked yet. Start by adding one!
              </div>
            )}
          </div>
        </div>
      </div>

      <TrackerDetailModal
        isOpen={!!detailOpp}
        onClose={() => setDetailOpp(null)}
        opportunity={detailOpp}
        updateStatus={updateStatus}
        onSmartApply={() => {
          setSmartApplyOpp(detailOpp);
          setDetailOpp(null);
        }}
      />

      <ApplyModal
        isOpen={!!smartApplyOpp}
        onClose={() => setSmartApplyOpp(null)}
        opportunity={
          smartApplyOpp
            ? ({
                ...smartApplyOpp,
                id: smartApplyOpp.oppId,
                title: smartApplyOpp.title || "Untitled Opportunity",
              } as unknown as ApplyModalOpportunity)
            : null
        }
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  highlight,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all",
        highlight
          ? "border-amber-300 bg-white shadow-md ring-2 ring-amber-100"
          : "border-slate-200 bg-white"
      )}
    >
      <div className="mb-2 flex items-center gap-3">
        <div className={cn("rounded-lg p-2", color)}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <p className="ml-1 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
