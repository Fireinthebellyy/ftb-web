"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { CheckCircle} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function ColdDmCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const templateId = searchParams.get("templateId");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!templateId) {
      toast.error("Template ID is required");
      router.push("/");
      return;
    }

    if (session === undefined) {
      // Session is still loading, wait
      return;
    }

    if (!session) {
      router.push(`/login?returnUrl=/cold-dm/checkout?templateId=${templateId}`);
      return;
    }

    initiateCheckout();
  }, [templateId, session]);

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  const initiateCheckout = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/cold-dm/checkout", { templateId });

      if (response.data.success) {
        setTemplate(response.data.template);
        setOrder(response.data.order);
        setLoading(false);
      } else {
        toast.error(response.data.error || "Failed to initiate checkout");
        router.back();
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.error || "Failed to initiate checkout");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order || !template) return;

    setProcessing(true);

    try {
      const scriptLoaded = await new Promise((resolve) => {
        if (typeof window !== "undefined" && (window as any).Razorpay) {
          return resolve(true);
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        setProcessing(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Fire In The Belly",
        description: template.title,
        order_id: order.id,
        handler: async function (razorpayResponse: any) {
          setProcessing(true);
          try {
            const verifyRes = await axios.post("/api/cold-dm/checkout/verify", {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success("Payment successful! Template unlocked.");
              router.back();
            } else {
              toast.error("Payment verification failed");
              setProcessing(false);
            }
          } catch (error: any) {
            console.error("Verification error:", error);
            toast.error(error.response?.data?.error || "Payment verification failed");
            setProcessing(false);
          }
        },
        prefill: {
          name: session?.user?.name || "",
        },
        theme: {
          color: "#ec5b13",
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment");
      setProcessing(false);
    }
  };

  // Parse benefits from comma-separated string or array
  const benefits = template?.benefits
    ? Array.isArray(template.benefits)
      ? template.benefits
      : template.benefits.split(',').map((b: string) => b.trim()).filter((b: string) => b)
    : ["Instant access after payment", "Lifetime access", "10x response rate guarantee"];

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-0 rounded-2xl"
          showCloseButton={true}
        >
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading checkout...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-h-[90vh] overflow-y-auto p-0 rounded-2xl pt-6"
        showCloseButton={true}
      >
        <div className="p-6 md:p-8 space-y-3">
          {template && (
            <>
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-slate-900 text-[13px] sm:text-base">
                    {template.checkoutTitle || template.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {template.checkoutDescription || "Get access to professional Cold DM templates with proven 10x response rate"}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pl-4">
                  <span className="text-[13px] sm:text-sm text-slate-600">Price</span>
                  <div className="text-right">
                    <span className="text-sm sm:text-xl font-bold text-slate-900">
                      ₹{template.price}
                    </span>
                    {template.originalPrice && (
                      <span className="text-xs sm:text-lg text-slate-500 line-through ml-2">
                        ₹{template.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {benefits.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handlePayment}
                disabled={processing}
                className="h-9 sm:h-10 w-full bg-neutral-900 text-xs sm:text-sm font-semibold hover:bg-neutral-800 md:h-12 md:text-base text-white"
              >
                {processing ? "Processing..." : "Pay Now"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
