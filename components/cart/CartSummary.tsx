// components/cart/CartSummary.tsx
/**
 * @file This file defines the `CartSummary` component. It uses the @paystack/inline-js
 * NPM package for a reliable, asynchronous, webhook-driven "payment-first" flow.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Paystack from "@paystack/inline-js";

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
import { CartItem } from "@/types";

// State for this simplified, async flow
type ProcessingState = "idle" | "awaiting_payment";

export function CartSummary() {
  const { totalPrice, totalItems, cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");

  /**
   * Initiates the Paystack payment using the NPM package. The actual order
   * creation is handled asynchronously by the backend via webhooks.
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

    // 2. Instantiate Paystack class from the imported package
    const paystack = new Paystack();

    // 3. Call the newTransaction method with the updated configuration
    paystack.newTransaction({
      key: paystackPublicKey,
      email: session.user.email!,
      amount: Math.round(totalPrice * 100),
      currency: "KES",
      reference: uniqueRef,
      subaccountCode: tedbooksSubaccount,
      // --- THE FIX IS HERE ---
      // We cast the metadata object to `any` to bypass the strict type definition.
      // This allows us to send our custom data structure, which the Paystack API accepts.
      metadata: {
        userId: session.user.id!,
        cartItems: cartItems.map((item: CartItem) => ({
          bookId: item._id,
          quantity: item.quantity,
        })),
        subaccount: tedbooksSubaccount,
      } as any,
      onSuccess: (transaction) => {
        toast.success("Payment successful!", {
          description:
            "Your order is being confirmed. You will be redirected...",
        });
        clearCart();
        router.push(`/order/success?ref=${transaction.reference}`);
      },
      onCancel: () => {
        if (processingState === "awaiting_payment") {
          toast.info("Payment was cancelled.");
          setProcessingState("idle");
        }
      },
      onError: (error) => {
        toast.error("Payment Error", { description: error.message });
        setProcessingState("idle");
      },
    });
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
