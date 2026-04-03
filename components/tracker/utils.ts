import { TrackerItem } from "@/components/providers/TrackerProvider";

interface TrackerDisplayInput {
  company?: string;
  title?: string;
}

export function getTrackerDisplayValues({
  company,
  title,
}: TrackerDisplayInput): {
  companyName: string;
  titleText: string;
  avatarInitial: string;
} {
  const companyName =
    typeof company === "string" && company.trim().length > 0
      ? company.trim()
      : "Source unavailable";

  const titleText =
    typeof title === "string" && title.trim().length > 0
      ? title.trim()
      : "Archived item";

  const avatarInitial =
    (companyName.charAt(0) || titleText.charAt(0) || "A").toUpperCase();

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

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

export function getTrackerLogoUrl(opp: TrackerItem): string {
  return opp.logo || opp.poster || opp.images?.[0] || "";
}
