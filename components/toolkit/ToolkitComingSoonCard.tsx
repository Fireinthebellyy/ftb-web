"use client";

import { Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolkitComingSoonCardProps {
  className?: string;
}

export default function ToolkitComingSoonCard({
  className,
}: ToolkitComingSoonCardProps) {
  return (
    <Card
      className={cn(
        "group flex flex-row gap-0 overflow-hidden border border-dashed border-orange-200 bg-white py-0 sm:flex-col",
        className
      )}
    >
      <div className="relative min-h-28 w-28 shrink-0 self-stretch overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 sm:aspect-video sm:h-auto sm:w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
          <div className="rounded-full bg-white/90 p-2 shadow-sm">
            <Rocket className="h-4 w-4 text-orange-600" />
          </div>
          <Badge className="bg-orange-500 text-[10px] text-white hover:bg-orange-500 sm:text-xs">
            Coming Soon
          </Badge>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col justify-between p-3 sm:block">
        <p className="mb-1 text-[11px] text-gray-500 sm:text-xs">
          Built for students like you
        </p>

        <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-gray-900 sm:text-base">
          More toolkits are on the way
        </h3>

        <p className="mb-2 line-clamp-2 text-[11px] text-gray-600 sm:text-xs">
          We are creating practical guides for internships, placements, and
          standout projects.
        </p>

        <div className="flex items-center">
          <span className="text-base font-bold text-gray-900 sm:text-lg">
            Stay tuned
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
