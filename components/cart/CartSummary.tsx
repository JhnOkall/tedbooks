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

// PayHero SDK type declaration
interface Window {
  PayHero: {
    init: (config: any) => void;
  };
}

declare const PayHero: Window["PayHero"];

export function CartSummary() {
  const { totalPrice, totalItems, cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    customId: string;
  } | null>(null);
  const sdkLoaded = useRef(false);

  const handleScriptLoad = () => {
    sdkLoaded.current = true;
  };

  const initializePayHero = (orderReference: string) => {
    if (!sdkLoaded.current || typeof PayHero === "undefined") {
      console.error("PayHero SDK not loaded");
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
      successUrl: null,
      failedUrl: null,
      callbackUrl: `${window.location.origin}/api/webhooks/payhero`,
    });

    return true;
  };

  const handlePaymentSuccess = () => {
    toast.loading("Payment received! Finalizing your order...");
    clearCart();
    router.push(`/order/success?orderId=${pendingOrder?.id}`);
  };

  const handlePaymentFailure = () => {
    toast.error("Payment Failed", {
      description: "Your payment could not be processed. Please try again.",
    });
    setIsProcessing(false);
  };

  const handlePayment = async () => {
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

      if (!res.ok) throw new Error("Could not create an order.");

      const newPendingOrder = await res.json();
      setPendingOrder({
        id: newPendingOrder._id,
        customId: newPendingOrder.customId,
      });

      toast.dismiss();
      toast.loading("Initializing payment...");

      // Step 2: Initialize PayHero payment
      const paymentInitialized = initializePayHero(newPendingOrder.customId);

      if (!paymentInitialized) {
        throw new Error("Failed to initialize payment system.");
      }

      toast.dismiss();

      // Step 3: Trigger the PayHero button click programmatically
      setTimeout(() => {
        const payHeroButton = document.querySelector(
          "#payHeroContainer button"
        );
        if (payHeroButton) {
          (payHeroButton as HTMLButtonElement).click();
        } else {
          throw new Error("Payment button not found.");
        }
      }, 500);
    } catch (error: any) {
      toast.error("Checkout Failed", { description: error.message });
      setIsProcessing(false);
    }
  };

  // Listen for PayHero payment messages
  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      if (event.data.paymentSuccess) {
        handlePaymentSuccess();
      } else if (event.data.paymentSuccess === false) {
        handlePaymentFailure();
      }
    };

    window.addEventListener("message", handlePaymentMessage);

    return () => {
      window.removeEventListener("message", handlePaymentMessage);
    };
  }, [pendingOrder]);

  return (
    <>
      <Script
        src="https://applet.payherokenya.com/cdn/button_sdk.js?v=3.1"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />

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
            onClick={handlePayment}
            disabled={cartItems.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            Pay
          </Button>
        </CardFooter>
      </Card>

      {/* Hidden PayHero container - will be triggered programmatically */}
      <div id="payHeroContainer" className="hidden"></div>
    </>
  );
}
