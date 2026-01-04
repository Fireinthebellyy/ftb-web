"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import ToolkitHero from "@/components/toolkit/ToolkitHero";
import ToolkitCardNew from "@/components/toolkit/ToolkitCardNew";
import { cn } from "@/lib/utils";
import { Toolkit } from "@/types/interfaces";

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
        <div className="container mx-auto px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolkitHero />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Toolkits
          </h2>
        </div>

        <div className="scrollbar-hide mb-8 flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === category
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredToolkits.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <svg
                className="h-8 w-8 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No toolkits found
            </h3>
            <p className="text-gray-500">
              {selectedCategory === "All"
                ? "Check back soon for new content!"
                : `No toolkits in ${selectedCategory} category yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredToolkits.map((toolkit) => (
              <ToolkitCardNew
                key={toolkit.id}
                toolkit={toolkit}
                onClick={() => handleCardClick(toolkit)}
              />
            ))}
          </div>
        )}

        {toolkits.length > 0 && filteredToolkits.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No toolkits found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
