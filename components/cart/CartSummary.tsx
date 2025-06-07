"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Script from "next/script";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

// Define PayHero on the window object for TypeScript
interface Window {
  PayHero?: {
    init: (config: any) => void;
  };
  location: Location;
  addEventListener: (
    type: string,
    listener: (event: MessageEvent) => void
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: MessageEvent) => void
  ) => void;
}
declare const window: Window;
declare const PayHero: NonNullable<Window["PayHero"]>;

export function CartSummary() {
  const { totalPrice, totalItems, cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    customId: string;
  } | null>(null);

  // Ref to track if the PayHero SDK script has loaded
  const sdkLoaded = useRef(false);

  // This function initializes PayHero and programmatically clicks its button
  const triggerPayHeroPayment = (order: { id: string; customId: string }) => {
    if (typeof PayHero === "undefined") {
      toast.error(
        "Payment service is currently unavailable. Please try again later."
      );
      setIsProcessing(false);
      return;
    }

    PayHero.init({
      paymentUrl: process.env.NEXT_PUBLIC_PAYHERO_LIPWA_URL!,
      containerId: "payHeroContainer", // The hidden container
      channelID: parseInt(process.env.NEXT_PUBLIC_PAYHERO_CHANNEL_ID!, 10),
      amount: totalPrice,
      phone: session?.user?.phone || "",
      name: session?.user?.name || "Valued Customer",
      reference: order.customId,
      buttonName: "PayHero", // This won't be visible
      buttonColor: "#000000", // This won't be visible
      width: "0px",
      height: "0px",
      successUrl: null, // We handle this manually
      failedUrl: null, // We handle this manually
      callbackUrl: `${window.location.origin}/api/webhooks/payhero`,
    });

    // Give the SDK a moment to inject the iframe button
    setTimeout(() => {
      const container = document.getElementById("payHeroContainer");
      const payButton = container?.querySelector("iframe"); // PayHero injects an iframe

      if (payButton) {
        payButton.click();
        // The payment modal is now open. We can stop our loading indicator.
        // We will show a new one on payment success/failure.
        setIsProcessing(false);
      } else {
        toast.error("Could not initiate payment. Please try again.");
        setIsProcessing(false);
      }
    }, 200); // 200ms delay to be safe
  };

  const handlePay = async (): Promise<void> => {
    if (!session?.user) {
      toast.error("Please sign in to proceed.");
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
      // Step 1: Create a PENDING order in our database
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

      if (!res.ok) throw new Error("Could not create your order.");

      const newPendingOrder = await res.json();
      toast.dismiss();
      toast.info("Order created. Initiating payment...");

      // Store the pending order, which will be used by the useEffect to trigger payment
      setPendingOrder({
        id: newPendingOrder._id,
        customId: newPendingOrder.customId,
      });
    } catch (error: any) {
      toast.dismiss();
      toast.error("Checkout Failed", { description: error.message });
      setIsProcessing(false);
    }
  };

  // This effect runs when a pendingOrder is created.
  // It waits for the SDK to be ready and then triggers the payment.
  useEffect(() => {
    if (pendingOrder && sdkLoaded.current) {
      triggerPayHeroPayment(pendingOrder);
    }
  }, [pendingOrder]); // Dependency on pendingOrder

  const handleScriptLoad = () => {
    sdkLoaded.current = true;
    // If an order was already created before the script finished loading, trigger payment now.
    if (pendingOrder) {
      triggerPayHeroPayment(pendingOrder);
    }
  };

  // Centralized payment event handling from PayHero iframe
  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      if (event.data.paymentSuccess) {
        // The webhook handles the order update. We just give user feedback and redirect.
        toast.loading("Payment received! Finalizing your order...");
        clearCart(); // Clear the cart on the client-side
        router.push(`/order/success?orderId=${pendingOrder?.id}`);
      } else if (event.data.paymentSuccess === false) {
        toast.error("Payment Failed", {
          description: "Your payment could not be processed. Please try again.",
        });
        // Reset state to allow another payment attempt for the same order
        setPendingOrder(null);
        setIsProcessing(false);
      }
    };

    window.addEventListener("message", handlePaymentMessage);
    return () => window.removeEventListener("message", handlePaymentMessage);
  }, [pendingOrder, clearCart, router]);

  return (
    <>
      {/* Load the PayHero SDK. It will be available on the window object */}
      <Script
        src="https://applet.payherokenya.com/cdn/button_sdk.js?v=3.1"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />
      {/* This is the hidden container where PayHero will inject its button */}
      <div id="payHeroContainer" style={{ display: "none" }}></div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Order Summary
          </CardTitle>
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
            className="w-full rounded-xl text-lg shadow-md"
            onClick={handlePay}
            disabled={cartItems.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            Pay Ksh. {totalPrice.toFixed(2)}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
