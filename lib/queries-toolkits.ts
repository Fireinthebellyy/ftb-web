import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Toolkit,
  ToolkitCommunityPost,
  ToolkitContentItem,
} from "@/types/interfaces";

export type ToolkitDetailResponse = {
  toolkit: Toolkit;
  hasPurchased: boolean;
  contentItems: ToolkitContentItem[];
  completedItemIds: string[];
};

export type ToolkitContentResponse = {
  toolkit: Pick<Toolkit, "id" | "title">;
  contentItems: ToolkitContentItem[];
};

export type ToolkitAccessResponse = {
  hasPurchased: boolean;
  completedItemIds: string[];
};

export type ToolkitCommunityResponse = {
  posts: ToolkitCommunityPost[];
};

async function fetchToolkit(toolkitId: string): Promise<ToolkitDetailResponse> {
  const { data } = await axios.get<ToolkitDetailResponse>(
    `/api/toolkits/${toolkitId}`
  );
  return data;
}

async function fetchToolkitContent(
  toolkitId: string
): Promise<ToolkitContentResponse> {
  const { data } = await axios.get<ToolkitContentResponse>(
    `/api/toolkits/${toolkitId}/content`
  );
  return data;
}

async function fetchToolkitAccess(
  toolkitId: string
): Promise<ToolkitAccessResponse> {
  const { data } = await axios.get<ToolkitAccessResponse>(
    `/api/toolkits/${toolkitId}/access`
  );
  return data;
}

async function fetchToolkitCommunity(
  toolkitId: string
): Promise<ToolkitCommunityResponse> {
  const { data } = await axios.get<ToolkitCommunityResponse>(
    `/api/toolkits/${toolkitId}/community`
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

export function useToolkitContent(toolkitId: string) {
  return useQuery({
    queryKey: ["toolkit-content", toolkitId],
    queryFn: () => fetchToolkitContent(toolkitId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useToolkitAccess(toolkitId: string) {
  return useQuery({
    queryKey: ["toolkit-access", toolkitId],
    queryFn: () => fetchToolkitAccess(toolkitId),
    staleTime: 1000 * 30,
  });
}

export function useToolkitCommunity(toolkitId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["toolkit-community", toolkitId],
    queryFn: () => fetchToolkitCommunity(toolkitId),
    staleTime: 1000 * 60,
    enabled,
  });
}

export function useToolkitPurchase(toolkitId: string, onSuccessRedirect?: () => void) {
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
    mutationFn: async (couponCode?: string) => {
      const { data } = await axios.post(
        `/api/toolkits/${toolkitId}`,
        couponCode ? { couponCode } : {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return data;
    },
    onSuccess: async (response: any) => {
      // Free purchase (coupon covered full amount) — no payment needed
      if (response.free) {
        toast.success("Toolkit unlocked for free! Redirecting...");
        qc.setQueryData(["toolkit", toolkitId], (old: any) => {
          if (old) {
            return { ...old, hasPurchased: true };
          }
          return old;
        });
        if (onSuccessRedirect) onSuccessRedirect();
        return;
      }

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
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            toast.success("Purchase successful! Redirecting...");
            qc.setQueryData(["toolkit", toolkitId], (old: any) => {
              if (old) {
                return { ...old, hasPurchased: true };
              }
              return old;
            });
            if (onSuccessRedirect) onSuccessRedirect();
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

      qc.setQueryData(
        ["toolkit-access", toolkitId],
        (old: ToolkitAccessResponse | undefined) => {
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

export function useSubmitCommunityResponse(toolkitId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["community-respond", toolkitId],
    mutationFn: async ({
      postId,
      selectedOptionIndex,
    }: {
      postId: string;
      selectedOptionIndex: number;
    }) => {
      const { data } = await axios.post<{
        selectedOptionIndex: number;
        optionVoteCounts?: number[];
        totalVotes?: number;
      }>(
        `/api/toolkits/${toolkitId}/community/${postId}/respond`,
        { selectedOptionIndex },
        { headers: { "Content-Type": "application/json" } }
      );
      return { postId, ...data };
    },
    onSuccess: (result) => {
      // Update the cached community posts with user's selection and vote counts
      qc.setQueryData(
        ["toolkit-community", toolkitId],
        (old: ToolkitCommunityResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            posts: old.posts.map((post: ToolkitCommunityPost) => {
              if (post.id !== result.postId) return post;
              return {
                ...post,
                userSelectedIndex: result.selectedOptionIndex,
                ...(result.optionVoteCounts !== undefined && {
                  optionVoteCounts: result.optionVoteCounts,
                  totalVotes: result.totalVotes,
                }),
              };
            }),
          };
        }
      );
    },
    onError: (error) => {
      console.error("Failed to submit community response:", error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("You have already answered this");
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    },
  });
}
