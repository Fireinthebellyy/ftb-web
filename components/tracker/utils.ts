import { TrackerItem } from "@/components/providers/TrackerProvider";

interface TrackerDisplayInput {
  company?: string;
  title?: string;
}

export interface TrackerDisplayValues {
  companyName: string;
  titleText: string;
  avatarInitial: string;
}

export function getTrackerDisplayValues({
  company,
  title,
}: TrackerDisplayInput): TrackerDisplayValues {
  const trimmedCompany = typeof company === "string" ? company.trim() : "";
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  const companyName =
    trimmedCompany.length > 0 ? trimmedCompany : "Source unavailable";

  const titleText =
    trimmedTitle.length > 0 ? trimmedTitle : "Archived item";

  const avatarInitial =
    (trimmedCompany.charAt(0) || trimmedTitle.charAt(0) || "A").toUpperCase();

  return {
    companyName,
    titleText,
    avatarInitial,
  };
}

export function formatGoogleCalendarDate(
  value: string | Date | undefined | null
): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.replace(/-/g, "");
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

export function getTrackerLogoUrl(opp: TrackerItem): string {
  const snapshot = opp.snapshot ?? {};

  return (
    snapshot.logo ||
    opp.logo ||
    snapshot.poster ||
    opp.poster ||
    snapshot.images?.[0] ||
    opp.images?.[0] ||
    ""
  );
}
