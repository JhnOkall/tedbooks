// components/cart/CartSummary.tsx (Updated version)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  subaccount: string;
  metadata: {
    orderId: string;
    subaccount: string;
    [key: string]: any;
  };
  callback: (response: any) => void;
  onClose: () => void;
}

// Enum for processing states for clearer logic
type ProcessingState =
  | "idle"
  | "creating_order"
  | "awaiting_payment"
  | "verifying";

export function CartSummary() {
  const { totalPrice, totalItems, cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");

  /**
   * Polls the backend to verify if the order status has been updated to 'Completed'.
   * @param {string} orderId The ID of the order to verify.
   * @returns {Promise<boolean>} A promise that resolves to true if the order is completed.
   */
  const verifyPayment = async (orderId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 15; // Poll for 30 seconds (15 attempts * 2s)
      const interval = 2000; // 2 seconds

      const poll = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`/api/orders/status/${orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "Completed") {
              clearInterval(poll);
              resolve(true);
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }

        if (attempts >= maxAttempts) {
          clearInterval(poll);
          resolve(false);
        }
      }, interval);
    });
  };

  const handlePayment = async () => {
    if (!session?.user || !session.user.email) {
      toast.error("Please sign in to proceed to checkout.");
      router.push("/api/auth/signin?callbackUrl=/cart");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (typeof window === "undefined" || !window.PaystackPop) {
      toast.error("Payment system is not available. Please refresh the page.");
      return;
    }

    setProcessingState("creating_order");
    const loadingToast = toast.loading("Preparing your order...");

    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          bookId: item._id,
          quantity: item.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error("Could not create an order.");

      const newPendingOrder = await res.json();
      const orderId = newPendingOrder._id;
      const orderReference = newPendingOrder.customId;

      toast.dismiss(loadingToast);
      setProcessingState("awaiting_payment");

      const paystackHandler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: session.user.email,
        amount: Math.round(totalPrice * 100),
        currency: "KES",
        ref: orderReference,
        subaccount: process.env.NEXT_PUBLIC_TEDBOOKS_SUBACCOUNT_CODE!,
        metadata: {
          orderId: orderId,
          subaccount: process.env.NEXT_PUBLIC_TEDBOOKS_SUBACCOUNT_CODE!,
          customer_name: session.user.name || "Valued Customer",
        },
        callback: async (response) => {
          // Payment was successful on the client, now verify on the server.
          setProcessingState("verifying");
          const verificationToast = toast.loading(
            "Payment received. Verifying order..."
          );

          const isVerified = await verifyPayment(orderId);
          toast.dismiss(verificationToast);

          if (isVerified) {
            toast.success("Order confirmed successfully!");
            clearCart();
            router.push(`/order/success?orderId=${orderId}`);
          } else {
            toast.info("Your payment is processing.", {
              description:
                "We've received your payment and will confirm your order shortly. You can check its status in your dashboard.",
            });
            clearCart(); // Clear cart as payment was made
            router.push("/account"); // Redirect to order history
          }
        },
        onClose: () => {
          // Only set back to idle if we were not in the verification stage
          if (processingState === "awaiting_payment") {
            toast.info("Payment was cancelled.");
            setProcessingState("idle");
          }
        },
      });

      paystackHandler.openIframe();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.dismiss();
      toast.error("Checkout Failed", { description: error.message });
      setProcessingState("idle");
    }
  };

  const isProcessing = processingState !== "idle";

  const getButtonText = () => {
    switch (processingState) {
      case "creating_order":
        return "Preparing...";
      case "awaiting_payment":
        return "Awaiting Payment...";
      case "verifying":
        return "Verifying...";
      default:
        return `Pay Ksh. ${totalPrice.toFixed(2)}`;
    }
  };

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ... Card content ... */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            Subtotal ({totalItems} items)
          </span>
          <span className="font-semibold">Ksh. {totalPrice.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total</span>
          <span>Ksh. {totalPrice.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          size="lg"
          className="w-full rounded-lg text-lg shadow-md"
          onClick={handlePayment}
          disabled={cartItems.length === 0 || isProcessing}
        >
          {isProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}
