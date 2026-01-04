"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import ToolkitCardNew from "@/components/toolkit/ToolkitCardNew";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Toolkit } from "@/types/interfaces";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  "All",
  "Career",
  "Skills",
  "Interview Prep",
  "Resume",
  "Salary Negotiation",
  "LinkedIn",
  "Networking",
];

export default function ToolkitPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const { data: toolkits = [], isLoading } = useQuery<Toolkit[]>({
    queryKey: ["toolkits"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/toolkits");
        return response.data;
      } catch (error) {
        console.error("Error fetching toolkits:", error);
        toast.error("Failed to load toolkits. Please try again later.");
        throw error;
      }
    },
  });

  const filteredToolkits = React.useMemo(() => {
    if (selectedCategory === "All") {
      return toolkits;
    }
    return toolkits.filter((toolkit) => toolkit.category === selectedCategory);
  }, [toolkits, selectedCategory]);

  const handleCardClick = (toolkit: Toolkit) => {
    router.push(`/toolkit/${toolkit.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Toolkits</h1>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            {CATEGORIES.map(() => (
              <Skeleton className="h-8 w-20 rounded-full" />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-40 w-full" />
                <div className="space-y-2 pt-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-12 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Toolkits</h1>
          <p className="mt-1 text-gray-600">
            Expert-crafted resources to help you level up your career
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1 text-sm",
                selectedCategory === category
                  ? "bg-neutral-700 text-gray-200"
                  : "bg-white text-gray-700"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {filteredToolkits.length === 0 ? (
          <div className="rounded-lg border bg-white py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-gray-600">
              No toolkits found
            </h3>
            <p className="text-gray-500">
              {selectedCategory === "All"
                ? "Check back soon for new content!"
                : `No toolkits in ${selectedCategory} category yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredToolkits.map((toolkit) => (
              <ToolkitCardNew
                key={toolkit.id}
                toolkit={toolkit}
                onClick={() => handleCardClick(toolkit)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
