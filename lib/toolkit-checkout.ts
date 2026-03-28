import axios from "axios";
import { toast } from "sonner";

type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type PurchaseResponse = {
  free?: boolean;
  key?: string;
  order?: {
    id: string;
    amount: number;
    currency: string;
  };
};

async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if ((window as any).Razorpay) return true;

  return await new Promise((resolve) => {
    const selector = 'script[src="https://checkout.razorpay.com/v1/checkout.js"]';
    const existing = document.querySelector<HTMLScriptElement>(selector);

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function startToolkitCheckout(
  toolkitId: string,
  onSuccessRedirect: (path: string) => void
): Promise<void> {
  const scriptLoaded = await loadRazorpayScript();

  if (!scriptLoaded || !(window as any).Razorpay) {
    toast.error("Unable to load payment gateway. Please try again.");
    return;
  }

  const { data } = await axios.post<PurchaseResponse>(
    `/api/toolkits/${toolkitId}`,
    {},
    { headers: { "Content-Type": "application/json" } }
  );

  if (data?.free) {
    toast.success("Toolkit unlocked! Redirecting...");
    onSuccessRedirect(`/toolkit/${toolkitId}/content`);
    return;
  }

  if (!data?.key || !data?.order?.id) {
    toast.error("Failed to initialize payment");
    return;
  }

  const options = {
    key: data.key,
    amount: data.order.amount,
    currency: data.order.currency,
    name: "Fire in the Belly",
    description: "Toolkit Purchase",
    order_id: data.order.id,
    handler: async (razorpayResponse: RazorpaySuccessPayload) => {
      try {
        await axios.post(
          `/api/toolkits/${toolkitId}/verify`,
          {
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
          },
          { headers: { "Content-Type": "application/json" } }
        );

        toast.success("Purchase successful! Redirecting...");
        onSuccessRedirect(`/toolkit/${toolkitId}/content`);
      } catch (error) {
        console.error("Verification failed:", error);
        toast.error("Payment verification failed. Contact support.");
      }
    },
    theme: {
      color: "#F97316",
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
