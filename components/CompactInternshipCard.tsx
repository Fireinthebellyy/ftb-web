"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { InternshipPostProps } from "@/types/interfaces";

const CompactInternshipCard: React.FC<InternshipPostProps> = ({
  internship,
}) => {
  const {
    title,
    type,
    location,
    hiringOrganization,
    createdAt,
  } = internship;

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Left: Rounded image 42px */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-500">
            {(hiringOrganization || title).charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content: Two rows */}
      <div className="flex-1 min-w-0">
        {/* First row: Role in bold and company name */}
        <div className="font-bold text-sm text-gray-900 truncate">
          {title}
        </div>

        {/* Second row: in-office/remote and location */}
        <div className="text-xs text-gray-600 truncate">
          {(type || "internship").replace("_", " ")}
          {location ? ` (${location})` : ""}
        </div>
      </div>

      {/* Extreme right: Time posted */}
      <div className="flex-shrink-0 text-xs text-gray-500">
        {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : ""}
      </div>
    </div>
  );
};

export default CompactInternshipCard;
