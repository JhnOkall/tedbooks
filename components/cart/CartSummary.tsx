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
declare global {
  interface Window {
    PayHero?: {
      init: (config: PayHeroConfig) => void;
      show?: () => void;
      hide?: () => void;
    };
  }
}

/**
 * PayHero configuration interface for better type safety
 */
interface PayHeroConfig {
  paymentUrl: string;
  containerId: string;
  channelID: number;
  amount: number;
  phone: string;
  name: string;
  reference: string;
  buttonName: string;
  buttonColor: string;
  width: string;
  height: string;
  successUrl?: string | null;
  failedUrl?: string | null;
  callbackUrl: string;
}

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
  const [sdkLoaded, setSdkLoaded] = useState(false);
  /** Ref to track initialization attempts */
  const initializationAttempted = useRef(false);

  /**
   * Callback function executed when the PayHero SDK script has finished loading.
   * Includes better error handling and SDK availability checking.
   */
  const handleScriptLoad = () => {
    console.log("PayHero script loaded");

    // Add a small delay to ensure the SDK is fully initialized
    setTimeout(() => {
      if (typeof window !== "undefined" && window.PayHero) {
        setSdkLoaded(true);
        console.log("PayHero SDK is now available");
      } else {
        console.error("PayHero SDK failed to initialize properly");
        // Try to check again after a longer delay
        setTimeout(() => {
          if (typeof window !== "undefined" && window.PayHero) {
            setSdkLoaded(true);
            console.log("PayHero SDK is now available (delayed)");
          } else {
            toast.error(
              "Payment system failed to load. Please refresh the page."
            );
          }
        }, 2000);
      }
    }, 1000);
  };

  /**
   * Handle script loading errors
   */
  const handleScriptError = () => {
    console.error("Failed to load PayHero SDK script");
    toast.error("Payment system failed to load. Please refresh the page.");
  };

  /**
   * Initializes the PayHero payment widget with the necessary configuration.
   * @param {string} orderReference - The unique custom ID of the order being paid for.
   * @returns {Promise<boolean>} - True if initialization was successful, false otherwise.
   */
  const initializePayHero = async (
    orderReference: string
  ): Promise<boolean> => {
    if (!sdkLoaded || typeof window === "undefined" || !window.PayHero) {
      console.error("PayHero SDK is not loaded or available.");
      return false;
    }

    if (initializationAttempted.current) {
      console.log("PayHero already initialized, skipping...");
      return true;
    }

    try {
      const config: PayHeroConfig = {
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
        successUrl: null,
        failedUrl: null,
        callbackUrl: `${window.location.origin}/api/webhooks/payhero`,
      };

      console.log("Initializing PayHero with config:", config);
      window.PayHero.init(config);
      initializationAttempted.current = true;

      // Wait a bit for the button to be rendered
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error("Error initializing PayHero:", error);
      return false;
    }
  };

  /**
   * Triggers the PayHero payment button with better error handling
   */
  const triggerPayHeroButton = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = 500;

      const checkForButton = () => {
        const payHeroButton = document.querySelector(
          "#payHeroContainer button"
        ) as HTMLButtonElement;

        if (payHeroButton) {
          console.log("PayHero button found, clicking...");
          payHeroButton.click();
          resolve(true);
        } else if (attempts < maxAttempts) {
          attempts++;
          console.log(
            `PayHero button not found, attempt ${attempts}/${maxAttempts}`
          );
          setTimeout(checkForButton, checkInterval);
        } else {
          console.error("PayHero button not found after maximum attempts");
          resolve(false);
        }
      };

      checkForButton();
    });
  };

  /**
   * Handles the successful payment event from the PayHero SDK.
   * Clears the cart and redirects the user to the order success page.
   */
  const handlePaymentSuccess = () => {
    if (!pendingOrder) return;
    toast.success("Payment successful!");
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
    setPendingOrder(null);
    initializationAttempted.current = false;
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
    const loadingToast = toast.loading("Preparing your order...");

    try {
      // Step 1: Create a "Pending" order in the local database.
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
      setPendingOrder({
        id: newPendingOrder._id,
        customId: newPendingOrder.customId,
      });

      toast.dismiss(loadingToast);
      toast.loading("Initializing payment...");

      // Step 2: Initialize the PayHero payment SDK.
      const paymentInitialized = await initializePayHero(
        newPendingOrder.customId
      );
      if (!paymentInitialized) {
        throw new Error("Failed to initialize payment system.");
      }

      toast.dismiss();
      toast.loading("Opening payment dialog...");

      // Step 3: Trigger the PayHero button
      const buttonTriggered = await triggerPayHeroButton();
      if (!buttonTriggered) {
        throw new Error("Payment dialog could not be opened.");
      }

      toast.dismiss();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.dismiss();
      toast.error("Checkout Failed", {
        description: error.message || "An unexpected error occurred.",
      });
      setIsProcessing(false);
      setPendingOrder(null);
      initializationAttempted.current = false;
    }
  };

  /**
   * Effect hook to listen for payment status messages posted from the PayHero iframe.
   * This is the primary mechanism for receiving asynchronous payment results.
   */
  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      // Validate the origin for security
      const allowedOrigins = [
        "https://applet.payherokenya.com",
        "https://api.payherokenya.com",
      ];

      if (!allowedOrigins.some((origin) => event.origin.startsWith(origin))) {
        return; // Ignore messages from unknown origins
      }

      console.log("Received payment message:", event.data);

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
  }, [pendingOrder]);

  // Reset initialization state when SDK loads
  useEffect(() => {
    if (sdkLoaded) {
      initializationAttempted.current = false;
    }
  }, [sdkLoaded]);

  return (
    <>
      {/* Load the external PayHero SDK script */}
      <Script
        src="https://applet.payherokenya.com/cdn/button_sdk.js?v=3.1"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="afterInteractive"
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
            disabled={cartItems.length === 0 || isProcessing || !sdkLoaded}
          >
            {isProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {!sdkLoaded ? "Loading Payment System..." : "Pay"}
          </Button>
        </CardFooter>
      </Card>

      {/* This container is the mount point for the PayHero SDK's button. */}
      <div
        id="payHeroContainer"
        className="hidden"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
        }}
      ></div>
    </>
  );
}
