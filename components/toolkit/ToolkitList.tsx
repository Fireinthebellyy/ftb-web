"use client";

import React, { useState } from "react";
import ToolkitCard from "./ToolkitCard";
import ToolkitModal from "./ToolkitModal";
import { Toolkit } from "@/types/interfaces";

interface ToolkitListProps {
  toolkits: Toolkit[];
  onPurchase: (toolkitId: string) => Promise<void>;
}

export default function ToolkitList({
  toolkits,
  onPurchase,
}: ToolkitListProps) {
  const [selectedToolkit, setSelectedToolkit] = useState<Toolkit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchasedToolkits, setPurchasedToolkits] = useState<Set<string>>(
    new Set()
  );

  const handleCardClick = (toolkit: Toolkit) => {
    setSelectedToolkit(toolkit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedToolkit(null);
  };

  const handlePurchaseSuccess = (toolkitId: string) => {
    setPurchasedToolkits((prev) => new Set(prev).add(toolkitId));
  };

  const handlePurchase = async (toolkitId: string) => {
    try {
      await onPurchase(toolkitId);
      handlePurchaseSuccess(toolkitId);
    } catch (error) {
      console.error("Purchase failed:", error);
      throw error;
    }
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

      {selectedToolkit && (
        <ToolkitModal
          toolkit={selectedToolkit}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onPurchase={handlePurchase}
          hasPurchased={purchasedToolkits.has(selectedToolkit.id)}
        />
      )}
    </div>
  );
}
