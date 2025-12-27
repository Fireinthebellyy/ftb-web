"use client";

import React from "react";
import ToolkitCard from "./ToolkitCard";
import { Toolkit } from "@/types/interfaces";
import { useRouter } from "next/navigation";

interface ToolkitListProps {
  toolkits: Toolkit[];
}

export default function ToolkitList({ toolkits }: ToolkitListProps) {
  const router = useRouter();

  const handleCardClick = (toolkit: Toolkit) => {
    router.push(`/toolkit/${toolkit.id}`);
  };

  if (toolkits.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No toolkits available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold">Available Toolkits</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {toolkits.map((toolkit) => (
          <ToolkitCard
            key={toolkit.id}
            toolkit={toolkit}
            onClick={() => handleCardClick(toolkit)}
          />
        ))}
      </div>
    </div>
  );
}
