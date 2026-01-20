import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toolkit, ToolkitContentItem } from "@/types/interfaces";

export type ToolkitDetailResponse = {
  toolkit: Toolkit;
  hasPurchased: boolean;
  contentItems: ToolkitContentItem[];
  completedItemIds: string[];
};

async function fetchToolkit(toolkitId: string): Promise<ToolkitDetailResponse> {
  const { data } = await axios.get<ToolkitDetailResponse>(
    `/api/toolkits/${toolkitId}`
  );
  return data;
}

export function useToolkit(toolkitId: string) {
  return useQuery({
    queryKey: ["toolkit", toolkitId],
    queryFn: () => fetchToolkit(toolkitId),
    staleTime: 1000 * 60,
  });
}

export function useToolkitPurchase(toolkitId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["purchase", toolkitId],
    onMutate: () => {
      qc.setQueryData(["toolkit", toolkitId], (old: any) => {
        if (old) {
          return { ...old, isPurchasing: true };
        }
        return old;
      });
    },
    mutationFn: async () => {
      const { data } = await axios.post(
        `/api/toolkits/${toolkitId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return data;
    },
    onSuccess: async (response: any) => {
      const { order, key } = response;

      if (typeof window === "undefined" || !window.Razorpay) {
        return;
      }

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Fire in the Belly",
        description: "Toolkit Purchase",
        order_id: order.id,
        handler: async (razorpayResponse: any) => {
          try {
            await axios.post(
              `/api/toolkits/${toolkitId}/verify`,
              {
                razorpay_order_id: order.id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            toast.success("Purchase successful! Redirecting to content...");
            qc.setQueryData(["toolkit", toolkitId], (old: any) => {
              if (old) {
                return { ...old, hasPurchased: true };
              }
              return old;
            });
          } catch (error) {
            console.error("Verification failed:", error);
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {},
        theme: {
          color: "#F97316",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    onError: (error) => {
      console.error("Purchase error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        toast.error(errorData.error || "Purchase failed");
      } else {
        toast.error(error instanceof Error ? error.message : "Purchase failed");
      }
    },
    onSettled: () => {
      qc.setQueryData(["toolkit", toolkitId], (old: any) => {
        if (old && "isPurchasing" in old) {
          const { isPurchasing: _, ...rest } = old;
          return rest;
        }
        return old;
      });
    },
  });
}

export function useMarkContentComplete(toolkitId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["progress", toolkitId],
    mutationFn: async (contentItemId: string) => {
      const { data } = await axios.post(
        `/api/toolkits/${toolkitId}/progress`,
        { contentItemId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return data;
    },
    onSuccess: (response, contentItemId) => {
      // Optimistically update the cache
      qc.setQueryData(
        ["toolkit", toolkitId],
        (old: ToolkitDetailResponse | undefined) => {
          if (old && !old.completedItemIds.includes(contentItemId)) {
            return {
              ...old,
              completedItemIds: [...old.completedItemIds, contentItemId],
            };
          }
          return old;
        }
      );
    },
    onError: (error) => {
      console.error("Failed to save progress:", error);
    },
  });
}
