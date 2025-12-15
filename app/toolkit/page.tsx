"use client";

import React from "react";
import ToolkitList from "@/components/toolkit/ToolkitList";
import { Toolkit } from "@/types/interfaces";
import { toast } from "sonner";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Declare global Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ToolkitPage() {
  const router = useRouter();

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

  const handlePurchase = async (toolkitId: string) => {
    try {
      // Step 1: Initiate purchase and get Razorpay order details
      const response = await axios.post(
        `/api/toolkits/${toolkitId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { order, key } = response.data;

      // Check if Razorpay is loaded
      if (typeof window === "undefined" || !window.Razorpay) {
        toast.error(
          "Payment gateway not loaded. Please refresh the page and try again."
        );
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: "Fire in the Belly",
        description: "Toolkit Purchase",
        order_id: order.id,
        handler: async (response: any) => {
          // Payment successful, verify and complete
          try {
            await axios.post(
              `/api/toolkits/${toolkitId}/verify`,
              {
                razorpay_order_id: order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            toast.success("Purchase successful! Redirecting to content...");
            router.push(`/toolkit/${toolkitId}/content`);
          } catch (error) {
            console.error("Verification failed:", error);
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {
          // You can add user details here if available
        },
        theme: {
          color: "#F97316",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Purchase error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        toast.error(errorData.error || "Purchase failed");
      } else {
        toast.error(error instanceof Error ? error.message : "Purchase failed");
      }
      throw error;
    }
  };

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
      <ToolkitList toolkits={toolkits} onPurchase={handlePurchase} />
    </div>
  );
}
