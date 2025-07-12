'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Building2, ExternalLink, Phone } from "lucide-react";
import { format } from "date-fns";
import React from "react";
import Link from "next/link";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: string | string[];
  tags?: string[];
  url?: string;
  image?: string;
  created_at?: string;
  location?: string;
  organiser_info?: string;
  start_date?: string;
  end_date?: string;
};


interface OpportunityCardProps {
  opportunity: Opportunity;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const {
    type,
    tags,
    title,
    description,
    url,
    image,
    created_at,
    location,
    organiser_info,
    start_date,
    end_date
  } = opportunity;

  
  const primaryType = Array.isArray(type) ? type[0] : type;

  const getTypeColor = (type?: string): string => {
    const colors: Record<string, string> = {
      hackathon: "bg-blue-100 text-blue-800 border-blue-200",
      grant: "bg-green-100 text-green-800 border-green-200",
      competition: "bg-purple-100 text-purple-800 border-purple-200",
      ideathon: "bg-orange-100 text-orange-800 border-orange-200",
      others: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[type?.toLowerCase() || "others"] || colors.others;
  };

  const handleScheduleCall = () => {
    // For Future Use
  };

  const handleViewProfile = () => {
    // For Future Use
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white pt-0">
      {/* Image */}
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge className={`${getTypeColor(primaryType)} font-medium`}>
              {primaryType?.charAt(0).toUpperCase() + primaryType?.slice(1)}
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-bold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </CardTitle>
          {url && (
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </Link>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
          {description}
        </p>

        <div className="space-y-3">
          {/* Dates */}
          {(start_date || end_date) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span>
                {start_date && format(new Date(start_date), "MMM dd")}
                {start_date && end_date && " - "}
                {end_date && format(new Date(end_date), "MMM dd, yyyy")}
              </span>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* Organiser Info */}
          {organiser_info && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="truncate">{organiser_info}</span>
            </div>
          )}
        </div>

        {/* Created At */}
        {created_at && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Posted {format(new Date(created_at), "MMM dd, yyyy")}
            </span>
          </div>
        )}
      </CardContent>

      {/* Buttons */}
      <CardFooter className="pt-0 gap-2">
        <Button
          onClick={handleScheduleCall}
          variant="outline"
          size="sm"
          className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
        >
          <Phone className="w-4 h-4 mr-2" />
          Schedule Call
        </Button>
        <Button
          onClick={handleViewProfile}
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OpportunityCard;
