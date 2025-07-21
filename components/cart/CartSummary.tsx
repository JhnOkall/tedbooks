/**
 * @file This file defines the `CartSummary` component. It uses an asynchronous,
 * webhook-driven "payment-first" flow with Paystack, compatible with a centralized webhook router.
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
// CORRECTED IMPORT
import { CartItem } from "@/types";

// --- Paystack Types ---
declare global {
  interface Window {
    PaystackPop?: new (config: PaystackConfig) => {
      open: () => void;
      close: () => void;
    };
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: "KES";
  ref: string;
  subaccount: string; // Crucial for routing
  metadata: {
    userId: string;
    cartItems: { bookId: string; quantity: number }[];
    subaccount: string; // Must be in metadata for the central router
    [key: string]: any;
  };
  callback: (response: { reference: string }) => void;
  onClose: () => void;
}

// State for this simplified, async flow
type ProcessingState = "idle" | "awaiting_payment";

export function CartSummary() {
  const { totalPrice, totalItems, cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");

  /**
   * Initiates the Paystack payment. The actual order creation is handled
   * asynchronously by the backend via webhooks.
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
    const tedbooksSubaccount = process.env.NEXT_PUBLIC_TEDBOOKS_SUBACCOUNT_CODE;

    if (!paystackPublicKey || !tedbooksSubaccount) {
      toast.error("Payment configuration error. Please contact support.");
      console.error(
        "FATAL: Paystack public key or TedBooks subaccount code is missing."
      );
      return;
    }

    setProcessingState("awaiting_payment");

    const uniqueRef = `TB-${Date.now()}`;

    // 2. Configure and launch the Paystack payment modal
    const paystackConfig: PaystackConfig = {
      key: paystackPublicKey,
      email: session.user.email!,
      amount: Math.round(totalPrice * 100),
      currency: "KES",
      ref: uniqueRef,
      subaccount: tedbooksSubaccount,
      metadata: {
        userId: session.user.id!,
        // CORRECTED TYPE USAGE
        cartItems: cartItems.map((item: CartItem) => ({
          bookId: item._id,
          quantity: item.quantity,
        })),
        // This is VITAL for your central webhook router
        subaccount: tedbooksSubaccount,
      },
      callback: (response) => {
        // 3. Payment successful on client. Clear cart and redirect.
        // The backend will handle order creation via webhook.
        toast.success("Payment successful!", {
          description:
            "Your order is being confirmed. You will be redirected...",
        });
        clearCart();
        router.push(`/order/success?ref=${response.reference}`);
      },
      onClose: () => {
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
  };

  const isProcessing = processingState !== "idle";

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
          {isProcessing
            ? "Awaiting Payment..."
            : `Pay KES ${totalPrice.toFixed(2)}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
