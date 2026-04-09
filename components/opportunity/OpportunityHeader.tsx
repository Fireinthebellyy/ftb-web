import { BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Building2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { OpportunityPostProps } from "@/types/interfaces";
import { ExpandableDescription } from "./ExpandableDescription";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";

interface OpportunityHeaderProps {
  opportunity: OpportunityPostProps["opportunity"];
  isExpanded?: boolean;
}

const ORGANISER_MAX_LENGTH = 40;

const truncateToWords = (str: string, count: number): string => {
  if (!str) return "";
  const words = str.trim().split(/\s+/);
  if (words.length <= count) return str;
  return words.slice(0, count).join(" ") + "...";
};

const formatOrganiserInfo = (value?: string): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const firstSegment = trimmed.split("|")[0]?.trim() ?? "";
  const normalized = firstSegment || trimmed;

  if (normalized.length <= ORGANISER_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, ORGANISER_MAX_LENGTH - 1).trimEnd()}...`;
};

export function OpportunityHeader({
  opportunity,
  isExpanded = true,
}: OpportunityHeaderProps) {
  const {
    title,
    tags,
    description,
    location,
    organiserInfo,
    startDate,
    endDate,
    applyLink,
    user,
    createdAt,
    publishAt,
  } = opportunity;
  const displayOrganiserInfo = formatOrganiserInfo(organiserInfo);

  return (
    <div className="relative px-3 py-2 sm:px-4">
      <h2 className="mb-2 line-clamp-1 truncate text-base leading-tight font-bold text-gray-900 sm:text-lg">
        {title}
      </h2>

      {tags && tags.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1.5 sm:gap-2">
          {(isExpanded ? tags : tags.slice(0, 4)).map((tag, idx) => {
            const match = tag.match(/^(.*)\((.*)\)$/);
            const displayTag = match ? match[1] : tag;
            return (
              <Badge
                key={idx}
                className="cursor-default bg-neutral-200 px-2 py-1 text-[10px] text-gray-700 sm:text-xs"
                variant="secondary"
                title={match ? match[2] : undefined}
              >
                #{displayTag}
              </Badge>
            );
          })}
          {!isExpanded && tags.length > 4 && (
            <Badge className="bg-neutral-200 px-2 py-1 text-[10px] text-gray-600 sm:text-xs">
              +{tags.length - 4} more
            </Badge>
          )}
        </div>
      )}

      {description && (
        <ExpandableDescription text={description} isCardExpanded={isExpanded} />
      )}

      {(location || displayOrganiserInfo || startDate || endDate || applyLink) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs text-gray-600 sm:flex-row sm:flex-wrap sm:gap-4">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate text-xs">{location}</span>
              </div>
            )}

            {displayOrganiserInfo && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate text-xs sm:hidden">
                  {truncateToWords(displayOrganiserInfo, 2)}
                </span>
                <span className="hidden truncate text-xs sm:inline">
                  {displayOrganiserInfo}
                </span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex flex-col items-end gap-1 text-xs text-gray-600">
              {(startDate || endDate) && (
                <div className="flex items-baseline gap-1">
                  <CalendarDays className="size-3" />
                  <span className="text-xs">
                    {startDate && format(new Date(startDate), "MMM dd")}
                    {startDate && endDate && (
                      <>
                        {" - "}
                        {format(new Date(startDate), "MMM") ===
                        format(new Date(endDate), "MMM")
                          ? format(new Date(endDate), "dd")
                          : format(new Date(endDate), "MMM dd")}
                      </>
                    )}
                    {!startDate && endDate && format(new Date(endDate), "MMM dd")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="flex items-end space-x-2 pb-2 sm:items-center sm:pb-3">
        <div className="shrink-0">
          {user &&
          user.image &&
          !user.image.includes("https://media.licdn.com") ? (
            <div className="size-4 overflow-hidden rounded-full border border-gray-100 shadow sm:size-5">
              <Image
                src={tryGetStoragePublicUrl("avatar-images", user.image)}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
                width={30}
                height={30}
              />
            </div>
          ) : (
            <div className="flex size-4 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-gray-600 uppercase sm:size-5">
              {user && user.name
                ? user.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                : "OP"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-gray-900 sm:hidden">
              {truncateToWords(
                user && user.name ? user.name : "Opportunity Organizer",
                2
              )}
            </p>
            <p className="hidden truncate text-sm font-semibold text-gray-900 sm:block">
              {user && user.name ? user.name : "Opportunity Organizer"}
            </p>
            {user?.role === "member" && (
              <span title="Verified Member">
                <BadgeCheck className="size-4 stroke-3 text-orange-600" />
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {formatDate(publishAt || createdAt)}
        </p>
      </header>
    </div>
  );
}
