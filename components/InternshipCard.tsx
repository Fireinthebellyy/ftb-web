"use client";

import React from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { InternshipPostProps } from "@/types/interfaces";
import Link from "next/link";

const InternshipPost: React.FC<InternshipPostProps> = ({
  internship,
}) => {
  const {
    id,
    title,
    type,
    location,
    poster,
    createdAt,
  } = internship;

  return (
    <Link href={`/intern/${id}`} className="block">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        {/* Left: Rounded image 42px */}
        <div className="flex-shrink-0">
          {poster ? (
            <Image
              src={poster}
              alt={title}
              width={38}
              height={38}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-500">IMG</span>
            </div>
          )}
        </div>

        {/* Content: Two rows */}
        <div className="flex-1 min-w-0">
          {/* First row: Role in bold and company name */}
          <div className="font-bold text-sm text-gray-900 truncate">
            {title}
          </div>

          {/* Second row: in-office/remote and location */}
          <div className="text-xs text-gray-600 truncate">
            {type} ({location})
          </div>
        </div>

        {/* Extreme right: Time posted */}
        <div className="flex-shrink-0 text-xs text-gray-500">
          {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : ""}
        </div>
      </div>
    </Link>
  );
};

export default InternshipPost;
