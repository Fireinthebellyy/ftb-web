import { BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Building2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { OpportunityPostProps } from "@/types/interfaces";
import { ExpandableDescription } from "./ExpandableDescription";

interface OpportunityHeaderProps {
  opportunity: OpportunityPostProps["opportunity"];
  isExpanded?: boolean;
}

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
    user,
    createdAt,
    publishAt,
  } = opportunity;

  return (
    <div className="relative px-3 py-2 sm:px-4">
      <h2 className="mb-2 line-clamp-1 truncate text-base leading-tight font-bold text-gray-900 sm:text-lg">
        {title}
      </h2>

      {tags && tags.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1.5 sm:gap-2">
          {(isExpanded ? tags : tags.slice(0, 4)).map((tag, idx) => (
            <Badge
              key={idx}
              className="cursor-default bg-neutral-200 px-2 py-1 text-[10px] text-gray-700 sm:text-xs"
              variant="secondary"
            >
              #{tag}
            </Badge>
          ))}
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

      {(location || organiserInfo || startDate || endDate) && (
        <div className="mb-3 flex">
          <div className="flex gap-2 text-xs text-gray-600 sm:flex-row sm:flex-wrap sm:gap-4">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate text-xs">{location}</span>
              </div>
            )}

            {organiserInfo && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate text-xs">{organiserInfo}</span>
              </div>
            )}
          </div>
          <div className="ml-auto flex flex-col items-end gap-1 text-xs text-gray-600">
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
      )}

      <header className="flex items-end space-x-2 pb-2 sm:items-center sm:pb-3">
        <div className="shrink-0">
          {user &&
            user.image &&
            !user.image.includes("https://media.licdn.com") ? (
            <div className="size-4 overflow-hidden rounded-full border border-gray-100 shadow sm:size-5">
              <Image
                src={user.image}
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
            <p className="truncate text-sm font-semibold text-gray-900">
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
