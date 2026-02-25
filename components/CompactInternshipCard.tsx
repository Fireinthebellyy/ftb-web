"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { InternshipPostProps } from "@/types/interfaces";

const CompactInternshipCard: React.FC<InternshipPostProps> = ({
  internship,
}) => {
  const { title, type, location, createdAt } = internship;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Content: Two rows */}
      <div className="min-w-0 flex-1">
        {/* First row: Role in bold and company name */}
        <div className="truncate text-sm font-bold text-gray-900">{title}</div>

        {/* Second row: in-office/remote and location */}
        <div className="truncate text-xs text-gray-600">
          {(type || "internship").replace("_", " ")}
          {location ? ` (${location})` : ""}
        </div>
      </div>

      {/* Extreme right: Time posted */}
      <div className="flex-shrink-0 text-xs text-gray-500">
        {createdAt
          ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
          : ""}
      </div>
    </div>
  );
};

export default CompactInternshipCard;
