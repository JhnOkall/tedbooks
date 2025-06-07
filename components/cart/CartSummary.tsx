/**
 * @file This file defines the `CartSummary` component, which is responsible for displaying
 * the order total, handling the checkout process, and integrating with the PayHero payment gateway.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Script from "next/script";

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

/**
 * Augments the global `Window` interface to include the `PayHero` SDK object.
 * This provides type safety when interacting with the external script.
 */
interface Window {
  PayHero: {
    init: (config: any) => void;
    // TODO: Define a specific type for the PayHero configuration object instead of `any`
    // to improve type safety and provide better autocompletion.
  };
}

// Informs TypeScript that `PayHero` will be available on the global `window` object.
declare const PayHero: Window["PayHero"];

/**
 * A client component that displays the cart summary and orchestrates the entire
 * payment process, from creating a pending order to initializing the payment SDK.
 */
export function CartSummary() {
  const { totalPrice, totalItems, cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  /** State to track if a checkout process is currently active. */
  const [isProcessing, setIsProcessing] = useState(false);
  /** Stores the order details created in our database before payment is initiated. */
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    customId: string;
  } | null>(null);
  /** A ref to track if the external PayHero SDK script has successfully loaded. */
  const sdkLoaded = useRef(false);

  /**
   * Callback function executed when the PayHero SDK script has finished loading.
   */
  const handleScriptLoad = () => {
    sdkLoaded.current = true;
  };

  /**
   * Initializes the PayHero payment widget with the necessary configuration.
   * @param {string} orderReference - The unique custom ID of the order being paid for.
   * @returns {boolean} - True if initialization was successful, false otherwise.
   */
  const initializePayHero = (orderReference: string): boolean => {
    if (!sdkLoaded.current || typeof PayHero === "undefined") {
      console.error("PayHero SDK is not loaded or available.");
      return false;
    }

    PayHero.init({
      paymentUrl: process.env.NEXT_PUBLIC_PAYHERO_LIPWA_URL!,
      containerId: "payHeroContainer",
      channelID: parseInt(process.env.NEXT_PUBLIC_PAYHERO_CHANNEL_ID!, 10),
      amount: totalPrice,
      phone: session?.user?.phone || "",
      name: session?.user?.name || "Valued Customer",
      reference: orderReference,
      buttonName: `Pay Now KES ${totalPrice.toFixed(2)}`,
      buttonColor: process.env.NEXT_PUBLIC_PAYHERO_BUTTON_COLOR!,
      width: "100%",
      height: "48px",
      successUrl: null, // Using postMessage for callbacks instead of redirects.
      failedUrl: null, // Using postMessage for callbacks instead of redirects.
      callbackUrl: `${window.location.origin}/api/webhooks/payhero`,
    });
    // TODO: The server-side webhook at `/api/webhooks/payhero` must be secured to
    // validate the legitimacy of incoming payment notifications from PayHero.

    return true;
  };

  /**
   * Handles the successful payment event from the PayHero SDK.
   * Clears the cart and redirects the user to the order success page.
   */
  const handlePaymentSuccess = () => {
    if (!pendingOrder) return;
    toast.loading("Payment received! Finalizing your order...");
    clearCart();
    router.push(`/order/success?orderId=${pendingOrder.id}`);
  };

  /**
   * Handles the failed payment event from the PayHero SDK.
   * Informs the user and resets the processing state.
   */
  const handlePaymentFailure = () => {
    toast.error("Payment Failed", {
      description: "Your payment could not be processed. Please try again.",
    });
    setIsProcessing(false);
  };

  /**
   * Orchestrates the entire checkout process when the "Pay" button is clicked.
   * This involves creating a local order record and then initiating the payment gateway.
   */
  const handlePayment = async () => {
    // Pre-flight checks for user session and cart content.
    if (!session?.user) {
      toast.error("Please sign in to proceed to checkout.");
      router.push("/api/auth/signin?callbackUrl=/cart");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsProcessing(true);
    toast.loading("Preparing your order...");

    try {
      // Step 1: Create a "Pending" order in the local database.
      // This ensures we have a record of the transaction attempt.
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
      setPendingOrder({
        id: newPendingOrder._id,
        customId: newPendingOrder.customId,
      });

      // Step 2: Initialize the PayHero payment SDK.
      const paymentInitialized = initializePayHero(newPendingOrder.customId);
      if (!paymentInitialized) {
        throw new Error("Failed to initialize payment system.");
      }
      toast.dismiss();

      // Step 3: Programmatically trigger the PayHero button, which is mounted in a hidden div.
      // TODO: This `setTimeout` is a workaround. Explore if the SDK provides a more direct
      // invocation method (e.g., `PayHero.show()`) to avoid timing issues.
      setTimeout(() => {
        const payHeroButton = document.querySelector(
          "#payHeroContainer button"
        );
        if (payHeroButton) {
          (payHeroButton as HTMLButtonElement).click();
        } else {
          throw new Error("Payment button could not be found in the DOM.");
        }
      }, 500);
    } catch (error: any) {
      toast.error("Checkout Failed", { description: error.message });
      setIsProcessing(false);
    }
  };

  /**
   * Effect hook to listen for payment status messages posted from the PayHero iframe.
   * This is the primary mechanism for receiving asynchronous payment results.
   */
  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      // Check for the specific success flag from the PayHero SDK message.
      if (event.data?.paymentSuccess === true) {
        handlePaymentSuccess();
      } else if (event.data?.paymentSuccess === false) {
        handlePaymentFailure();
      }
    };

    window.addEventListener("message", handlePaymentMessage);

    // Cleanup: remove the event listener when the component unmounts.
    return () => {
      window.removeEventListener("message", handlePaymentMessage);
    };
  }, [pendingOrder]); // Re-bind if pendingOrder changes, though it's mostly for closure correctness.

  return (
    <>
      {/* Lazily loads the external PayHero SDK script when the component mounts. */}
      <Script
        src="https://applet.payherokenya.com/cdn/button_sdk.js?v=3.1"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />

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
            onClick={handlePayment}
            disabled={cartItems.length === 0 || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Pay
          </Button>
        </CardFooter>
      </Card>

      {/* This hidden container is the mount point for the PayHero SDK's button. */}
      <div id="payHeroContainer" className="hidden"></div>
    </>
  );
}
