"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Toolkit } from "@/types/interfaces";

interface ToolkitCardProps {
  toolkit: Toolkit;
  onClick: () => void;
}

export default function ToolkitCard({ toolkit, onClick }: ToolkitCardProps) {
  return (
    <Card
      className="cursor-pointer overflow-hidden transition-shadow duration-300 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-gray-100">
        {toolkit.coverImageUrl ? (
          <Image
            src={toolkit.coverImageUrl}
            alt={toolkit.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <span className="text-sm text-gray-500">No Image</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-1 text-lg font-semibold">
          {toolkit.title}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
          {toolkit.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full items-center justify-between">
          <span className="text-primary font-bold">
            ₹{(toolkit.price / 100).toFixed(2)}
          </span>
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
