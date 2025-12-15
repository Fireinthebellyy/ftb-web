"use client";

import React from "react";
import ToolkitList from "@/components/toolkit/ToolkitList";
import { Toolkit } from "@/types/interfaces";
import { toast } from "sonner";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export default function ToolkitPage() {
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolkitList toolkits={toolkits} />
    </div>
  );
}
