// components/cart/CartSummary.tsx
/**
 * @file This file defines the `CartSummary` component, which is responsible for displaying
 * the order total and handling the checkout process using Paystack.
 */

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

// --- Modernized Paystack Types (from Avenue Fashion) ---

// 1. Updated global type for the modern, class-based PaystackPop
declare global {
  interface Window {
    PaystackPop?: new (config: PaystackConfig) => {
      open: () => void;
      close: () => void;
    };
  }
}

// 2. A strong type for the Paystack configuration object
interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: "KES";
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

// 3. Clearer state management for the checkout process
type ProcessingState =
  | "idle"
  | "creating_order"
  | "awaiting_payment"
  | "verifying";

/**
 * A client component that displays the cart summary and orchestrates the entire
 * payment process, from creating a pending order to initializing Paystack.
 */
export function CartSummary() {
  const { totalPrice, totalItems, cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");

  /**
   * Polls the backend to verify if the order status has been updated to 'Paid' or 'Completed'.
   * This is a crucial step for security and reliability.
   * @param {string} orderId - The database ID of the order to verify.
   * @returns {Promise<boolean>} A promise that resolves to true if the order is paid.
   */
  const verifyPayment = async (orderId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 15; // Poll for 30 seconds
      const interval = 2000; // 2 seconds

      const poll = setInterval(async () => {
        attempts++;
        try {
          // IMPORTANT: This API route needs to exist on your backend.
          // It should fetch the order by its ID and return its status.
          const res = await fetch(`/api/orders/${orderId}`);
          if (res.ok) {
            const data = await res.json();
            // Check for a status that confirms payment (e.g., 'Paid', 'Completed')
            if (data.status === "Paid" || data.status === "Completed") {
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

  /**
   * Orchestrates the entire checkout process when the "Pay" button is clicked.
   */
  const handleCheckout = async () => {
    // 1. Pre-flight checks
    if (!session?.user) {
      toast.error("Please sign in to proceed to checkout.");
      router.push("/api/auth/signin?callbackUrl=/cart");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackPublicKey) {
      toast.error("Payment configuration error. Please contact support.");
      console.error("FATAL: Paystack public key is missing from .env.local");
      return;
    }

    setProcessingState("creating_order");
    const loadingToast = toast.loading("Preparing your order...");

    try {
      // 2. Create a "Pending" order in the local database.
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Could not create an order.");
      }

      const newPendingOrder = await res.json();
      toast.dismiss(loadingToast);

      // 3. Configure and launch the Paystack payment modal
      setProcessingState("awaiting_payment");
      const paystackConfig: PaystackConfig = {
        key: paystackPublicKey,
        email: session.user.email!,
        amount: Math.round(totalPrice * 100), // Amount in kobo/cents
        currency: "KES",
        ref: newPendingOrder.customId, // Unique reference for this transaction
        subaccount: process.env.NEXT_PUBLIC_TEDBOOKS_SUBACCOUNT_CODE!,
        metadata: {
          orderId: newPendingOrder._id, // Your internal DB order ID
          subaccount: process.env.NEXT_PUBLIC_TEDBOOKS_SUBACCOUNT_CODE!,
        },
        callback: async () => {
          setProcessingState("verifying");
          const verificationToast = toast.loading(
            "Payment received, verifying..."
          );
          const isVerified = await verifyPayment(newPendingOrder._id);
          toast.dismiss(verificationToast);

          if (isVerified) {
            toast.success("Order confirmed!");
            clearCart();
            router.push(`/order/success?orderId=${newPendingOrder._id}`);
          } else {
            toast.info("Your payment is processing.", {
              description:
                "We'll confirm your order shortly. You can check its status in your dashboard.",
            });
            router.push("/dashboard/orders"); // Redirect to order history
          }
        },
        onClose: () => {
          // Only show "cancelled" toast if user was in the middle of payment
          if (processingState === "awaiting_payment") {
            toast.info("Payment was cancelled.");
            setProcessingState("idle");
          }
        },
      };

      if (!window.PaystackPop) {
        toast.error("Payment gateway failed to load. Please refresh.");
        setProcessingState("idle");
        return;
      }

      const handler = new window.PaystackPop(paystackConfig);
      handler.open();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.dismiss(loadingToast);
      toast.error("Checkout Failed", {
        description: error.message || "An unexpected error occurred.",
      });
      setProcessingState("idle");
    }
  };

  const isProcessing = processingState !== "idle";

  const getButtonText = () => {
    switch (processingState) {
      case "creating_order":
        return "Preparing Order...";
      case "awaiting_payment":
        return "Awaiting Payment...";
      case "verifying":
        return "Verifying...";
      default:
        return `Pay KES ${totalPrice.toFixed(2)}`;
    }
  };

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          onClick={handleCheckout}
          disabled={cartItems.length === 0 || isProcessing}
        >
          {isProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}
